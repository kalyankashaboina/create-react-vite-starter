# ============================================================
#  create-react-vite-starter -- Publish and GitHub Setup
#
#  USAGE:
#    .\publish-and-setup.ps1            -> DRY RUN only (safe)
#    .\publish-and-setup.ps1 -publish   -> Full pipeline
# ============================================================

param([switch]$publish)

$ErrorActionPreference = "Stop"

$GIT_USER   = "kalyankashaboina"
$GIT_EMAIL  = "kalyankashaboina07@gmail.com"
$REPO_URL   = "https://github.com/kalyankashaboina/create-react-vite-starter.git"
$LogFile    = "publish-log-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').txt"

# ── Helpers ───────────────────────────────────────────────────

function Log {
    param([string]$msg, [string]$color = "White")
    $ts   = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $LogFile -Value $line
}

function Section {
    param([string]$title)
    $sep = "=" * 60
    $out = "`n$sep`n  $title`n$sep"
    Write-Host $out -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value $out
}

function RunCmd {
    param([string]$cmd, [string]$desc, [switch]$IgnoreError)
    Log ">> $desc" "Yellow"
    Log "   CMD: $cmd" "DarkGray"
    try {
        $out = Invoke-Expression $cmd 2>&1 | Out-String
        Add-Content -Path $LogFile -Value $out
        Write-Host $out
        return $out
    } catch {
        $errMsg = $_.Exception.Message
        Add-Content -Path $LogFile -Value "ERROR: $errMsg"
        if ($IgnoreError) {
            Log "WARNING (ignored): $errMsg" "DarkYellow"
            return ""
        } else {
            Log "ERROR: $errMsg" "Red"
            throw
        }
    }
}

function GetVersion {
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    return $pkg.version
}

function GitHasRemote {
    $remotes = git remote 2>&1 | Out-String
    return ($remotes -match "origin")
}

function GitHasBranch {
    param([string]$branch)
    $branches = git branch 2>&1 | Out-String
    return ($branches -match $branch)
}

function GitCurrentBranch {
    return (git rev-parse --abbrev-ref HEAD 2>&1 | Out-String).Trim()
}

function GitHasTag {
    param([string]$tag)
    $tags = git tag 2>&1 | Out-String
    return ($tags -match [regex]::Escape($tag))
}

function GitHasCommits {
    try {
        git rev-parse HEAD 2>&1 | Out-Null
        return $true
    } catch { return $false }
}

function GitHasUncommitted {
    $status = git status --porcelain 2>&1 | Out-String
    return ($status.Trim().Length -gt 0)
}

# ── Banner ────────────────────────────────────────────────────

Clear-Host
Write-Host ""
if ($publish) {
    Write-Host "  +============================================================+" -ForegroundColor Magenta
    Write-Host "  |         FULL PUBLISH MODE  (-publish flag set)            |" -ForegroundColor Magenta
    Write-Host "  |  dry-run -> npm publish -> git -> branch -> tag -> push   |" -ForegroundColor Magenta
    Write-Host "  +============================================================+" -ForegroundColor Magenta
} else {
    Write-Host "  +============================================================+" -ForegroundColor Cyan
    Write-Host "  |              DRY RUN MODE  (safe, nothing changes)        |" -ForegroundColor Cyan
    Write-Host "  |  Run with -publish when ready to go live.                 |" -ForegroundColor Cyan
    Write-Host "  +============================================================+" -ForegroundColor Cyan
}
Write-Host ""

Log "Log file  : $LogFile"         "DarkGray"
Log "Directory : $(Get-Location)"  "DarkGray"
Log "Repo URL  : $REPO_URL"        "DarkGray"
Log "Mode      : $(if ($publish) { 'PUBLISH' } else { 'DRY RUN' })" "DarkGray"

$VERSION = GetVersion
Log "Version   : $VERSION" "DarkGray"

# ── STEP 1: Git identity ──────────────────────────────────────
Section "STEP 1 -- Git Identity"

RunCmd "git config user.name  `"$GIT_USER`""  "Set git user.name"
RunCmd "git config user.email `"$GIT_EMAIL`"" "Set git user.email"
Log "Git identity set: $GIT_USER / $GIT_EMAIL" "Green"

# ── STEP 2: Git init (if not a repo yet) ─────────────────────
Section "STEP 2 -- Git Init"

if (-not (Test-Path ".git")) {
    Log "No git repo found -- initialising..." "Yellow"
    RunCmd "git init" "git init"
    Log "Git repo initialised." "Green"
} else {
    Log "Git repo already exists -- skipping init." "DarkYellow"
}

# ── STEP 3: Add remote (if not set) ──────────────────────────
Section "STEP 3 -- Git Remote"

if (GitHasRemote) {
    $currentUrl = (git remote get-url origin 2>&1 | Out-String).Trim()
    if ($currentUrl -ne $REPO_URL) {
        Log "Remote origin exists but URL differs -- updating to: $REPO_URL" "Yellow"
        RunCmd "git remote set-url origin `"$REPO_URL`"" "Update remote URL"
    } else {
        Log "Remote origin already set correctly: $REPO_URL" "Green"
    }
} else {
    Log "No remote found -- adding origin: $REPO_URL" "Yellow"
    RunCmd "git remote add origin `"$REPO_URL`"" "Add remote origin"
    Log "Remote origin added." "Green"
}

# ── STEP 4: Stage and commit local changes ────────────────────
Section "STEP 4 -- Stage and Commit Local Changes"

if (GitHasUncommitted) {
    Log "Uncommitted changes found -- staging and committing..." "Yellow"
    RunCmd "git add -A" "Stage all changes"
    RunCmd "git commit -m `"chore: update local changes v$VERSION`"" "Commit local changes"
    Log "Local changes committed." "Green"
} else {
    if (-not (GitHasCommits)) {
        Log "No commits yet -- creating initial commit..." "Yellow"
        RunCmd "git add -A" "Stage all files"
        RunCmd "git commit -m `"chore: initial release v$VERSION`"" "Initial commit"
        Log "Initial commit created." "Green"
    } else {
        Log "Nothing to commit -- working tree is clean." "DarkYellow"
    }
}

# Ensure we are on main
RunCmd "git branch -M main" "Rename current branch to main" -IgnoreError

# ── STEP 5: Pull from remote (accept ours on conflict) ────────
Section "STEP 5 -- Pull Remote Changes (ours wins on conflict)"

Log "Fetching from origin..." "Cyan"
RunCmd "git fetch origin" "git fetch origin" -IgnoreError

# Check if remote main exists
$remoteBranches = git branch -r 2>&1 | Out-String
if ($remoteBranches -match "origin/main") {
    Log "Remote main found -- pulling with ours strategy..." "Cyan"

    # Set merge strategy: our local changes always win
    RunCmd "git config pull.rebase false" "Set merge strategy"

    try {
        $pullOut = git pull origin main --allow-unrelated-histories -X ours 2>&1 | Out-String
        Add-Content -Path $LogFile -Value $pullOut
        Write-Host $pullOut

        if ($pullOut -match "CONFLICT") {
            Log "Conflicts detected -- accepting all local (ours) changes..." "Yellow"
            RunCmd "git checkout --ours ." "Accept all local changes"
            RunCmd "git add -A"           "Stage resolved files"
            RunCmd "git commit -m `"chore: merge remote, keep local changes`"" "Commit merge resolution"
            Log "Merge conflicts resolved -- local version kept." "Green"
        } else {
            Log "Pull complete -- no conflicts." "Green"
        }
    } catch {
        Log "Pull had issues -- forcing local version..." "Yellow"
        RunCmd "git checkout --ours ." "Force local version" -IgnoreError
        RunCmd "git add -A"           "Stage files"         -IgnoreError
        RunCmd "git commit -m `"chore: merge resolved, kept local`"" "Commit" -IgnoreError
        Log "Resolved by keeping local version." "Green"
    }
} else {
    Log "No remote main branch yet -- skipping pull." "DarkYellow"
}

# ── STEP 6: npm install ───────────────────────────────────────
Section "STEP 6 -- npm Install"

RunCmd "npm install" "Install CLI dependencies"
Log "Dependencies installed." "Green"

# ── STEP 7: DRY RUN (always runs) ────────────────────────────
Section "STEP 7 -- npm Publish DRY RUN"

Log "Showing what WOULD be published (nothing uploaded yet)..." "Cyan"
RunCmd "npm publish --dry-run --access public" "npm publish --dry-run"
Log "Dry run complete -- review the file list above." "Green"

# ── Stop here if no -publish flag ────────────────────────────

if (-not $publish) {
    Write-Host ""
    Write-Host "  +------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host "  |  DRY RUN finished. Review the output above.          |" -ForegroundColor Cyan
    Write-Host "  |                                                       |" -ForegroundColor Cyan
    Write-Host "  |  Ready to publish? Run:                              |" -ForegroundColor Cyan
    Write-Host "  |                                                       |" -ForegroundColor Cyan
    Write-Host "  |    .\publish-and-setup.ps1 -publish                  |" -ForegroundColor Yellow
    Write-Host "  |                                                       |" -ForegroundColor Cyan
    Write-Host "  +------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""
    Log "Stopped after dry run. Use -publish to go live." "DarkYellow"
    Log "Full log saved: $LogFile" "DarkGray"
    exit 0
}

# ══════════════════════════════════════════════════════════════
#  Below only runs with -publish
# ══════════════════════════════════════════════════════════════

# ── STEP 8: npm login check ───────────────────────────────────
Section "STEP 8 -- npm Login"

try {
    $whoami = (npm whoami 2>&1 | Out-String).Trim()
    if ($whoami -match "^[a-zA-Z0-9]") {
        Log "Already logged in as: $whoami" "Green"
    } else {
        Log "Not logged in -- please log in now..." "Yellow"
        npm login
    }
} catch {
    Log "Not logged in -- please log in now..." "Yellow"
    npm login
}

# ── STEP 9: npm PUBLISH ───────────────────────────────────────
Section "STEP 9 -- npm Publish (LIVE)"

Log "Publishing v$VERSION to npm..." "Magenta"
RunCmd "npm publish --access public" "npm publish"
Log "Published to npm!" "Green"

Start-Sleep -Seconds 4
RunCmd "npm view create-react-vite-starter version" "Verify version on npm" -IgnoreError

# ── STEP 10: Create release branch ───────────────────────────
Section "STEP 10 -- Git Release Branch"

$releaseBranch = "release/v$VERSION"

if (GitHasBranch $releaseBranch) {
    Log "Branch '$releaseBranch' already exists -- skipping create." "DarkYellow"
} else {
    RunCmd "git checkout -b `"$releaseBranch`"" "Create release branch"
    RunCmd "git checkout main"                   "Switch back to main"
    Log "Branch '$releaseBranch' created." "Green"
}

# ── STEP 11: Create git tag ───────────────────────────────────
Section "STEP 11 -- Git Tag"

$tag = "v$VERSION"

if (GitHasTag $tag) {
    Log "Tag '$tag' already exists -- skipping create." "DarkYellow"
} else {
    RunCmd "git tag -a `"$tag`" -m `"release: $tag`"" "Create annotated tag"
    Log "Tag '$tag' created." "Green"
}

# ── STEP 12: Push everything to GitHub ───────────────────────
Section "STEP 12 -- Push to GitHub"

Log "Pushing main branch..." "Cyan"
RunCmd "git push -u origin main" "Push main"

Log "Pushing release branch..." "Cyan"
RunCmd "git push origin `"$releaseBranch`"" "Push release branch" -IgnoreError

Log "Pushing tag..." "Cyan"
RunCmd "git push origin `"$tag`"" "Push tag" -IgnoreError

Log "All pushed to GitHub." "Green"

# ── DONE ──────────────────────────────────────────────────────
Section "ALL DONE"

Write-Host ""
Write-Host "  +======================================================+" -ForegroundColor Green
Write-Host "  |            PUBLISH COMPLETE  OK                     |" -ForegroundColor Green
Write-Host "  +======================================================+" -ForegroundColor Green
Write-Host ""
Write-Host "  npm page   : https://www.npmjs.com/package/create-react-vite-starter" -ForegroundColor Cyan
Write-Host "  Use it     : npx create-react-vite-starter my-app"                    -ForegroundColor Cyan
Write-Host "  GitHub     : $REPO_URL"                                               -ForegroundColor Cyan
Write-Host "  Tag        : $tag"                                                     -ForegroundColor Cyan
Write-Host "  Branch     : $releaseBranch"                                           -ForegroundColor Cyan
Write-Host ""
Write-Host "  Log file   : $(Get-Location)\$LogFile" -ForegroundColor DarkGray
Write-Host ""

Log "Pipeline complete for v$VERSION" "Green"