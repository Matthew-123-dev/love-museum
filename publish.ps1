<#
.SYNOPSIS
  Push The Museum of Us to GitHub and deploy both Public & Private URLs to Vercel.

.DESCRIPTION
  Runs pre-flight syntax checks, initializes/pushes the GitHub repository (via gh CLI
  or an existing/supplied origin remote), and deploys two separate Vercel production
  projects from this workspace:
    1. Public Edition  (MUSEUM_EDITION=public)
    2. Private Founders Edition (MUSEUM_EDITION=private)

  No secrets or API tokens are stored in this script. Authenticate beforehand with:
    gh auth login
    vercel login
  And add Redis / payment keys via Vercel Dashboard or `vercel env add`.

.EXAMPLE
  .\publish.ps1 -DryRun
  .\publish.ps1 -RepoName "our-love-museum" -Visibility private
  .\publish.ps1 -RemoteUrl "https://github.com/your-user/our-love-museum.git"
#>

[CmdletBinding()]
param(
  [string]$RepoName = "our-love-museum",
  [ValidateSet("public", "private")]
  [string]$Visibility = "private",
  [string]$RemoteUrl = "",
  [string]$Branch = "main",
  [string]$PublicProject = "our-love-museum-public",
  [string]$PrivateProject = "our-love-museum-private",
  [switch]$SkipGit,
  [switch]$SkipVercel,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [string]$Label,
    [scriptblock]$Action
  )
  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Magenta
  if ($DryRun) {
    Write-Host "    [dry-run] $($Action.ToString().Trim())" -ForegroundColor DarkGray
    return
  }
  & $Action
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "Command failed during '$Label' (exit code $LASTEXITCODE)."
  }
}

Push-Location -LiteralPath $PSScriptRoot
try {
  Write-Host "The Museum of Us — Publish & Dual-URL Vercel Deploy" -ForegroundColor Cyan
  Write-Host "Workspace: $PSScriptRoot"

  # 1. Pre-flight verification
  Invoke-Step "Validate vercel.json syntax" {
    Get-Content -LiteralPath "vercel.json" -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
  }

  $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
  if ($pythonCmd) {
    Invoke-Step "Verify Python backend compilation" {
      python -m py_compile museum_store.py api/index.py server.py
    }
  }

  # 2. GitHub Repository Setup & Push
  if (-not $SkipGit) {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
      throw "git CLI was not found on PATH. Install Git and retry."
    }

    if (-not (Test-Path -LiteralPath ".git")) {
      Invoke-Step "Initialize git repository on branch '$Branch'" {
        git init -b $Branch
      }
    }

    Invoke-Step "Stage project files (respecting .gitignore)" {
      git add -A
    }

    $pendingChanges = if (Test-Path -LiteralPath ".git") { git status --porcelain } else { "init" }
    if ($pendingChanges -or $DryRun) {
      Invoke-Step "Create deployment commit" {
        git commit -m "Deploy Our Love Museum (Heirloom Unlock, Proposal & Cloud Sync)"
      }
    } else {
      Write-Host "    Working tree clean; using existing commit." -ForegroundColor DarkGray
    }

    $existingOrigin = ""
    if (Test-Path -LiteralPath ".git") {
      try {
        $existingOrigin = (git remote get-url origin 2>$null | Out-String).Trim()
      } catch {
        $existingOrigin = ""
      }
    }

    if (-not $existingOrigin) {
      if ($RemoteUrl) {
        Invoke-Step "Attach origin remote and push '$Branch'" {
          git remote add origin $RemoteUrl
          git push -u origin $Branch
        }
      } elseif (Get-Command gh -ErrorAction SilentlyContinue) {
        $visibilityFlag = if ($Visibility -eq "public") { "--public" } else { "--private" }
        Invoke-Step "Create GitHub repo '$RepoName' ($Visibility) and push" {
          gh repo create $RepoName $visibilityFlag --source . --remote origin --push
        }
      } else {
        Write-Host ""
        Write-Host "No 'origin' remote found and GitHub CLI ('gh') is not installed." -ForegroundColor Yellow
        Write-Host "Create a repo on GitHub, then run:" -ForegroundColor Yellow
        Write-Host "  git remote add origin https://github.com/<USERNAME>/$RepoName.git"
        Write-Host "  git push -u origin $Branch"
        if (-not $DryRun) {
          throw "Cannot push to GitHub without -RemoteUrl or 'gh' CLI."
        }
      }
    } else {
      Invoke-Step "Push '$Branch' to origin ($existingOrigin)" {
        git push -u origin $Branch
      }
    }
  }

  # 3. Dual-URL Vercel Deployments (Public Edition + Private Founders Edition)
  if (-not $SkipVercel) {
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
      Write-Host ""
      Write-Host "Vercel CLI not found. Install it with: npm i -g vercel" -ForegroundColor Yellow
      Write-Host "Manual dual-URL deploy commands:" -ForegroundColor Yellow
      Write-Host "  1) Public Edition:  vercel link --yes --project $PublicProject && vercel --prod"
      Write-Host "  2) Private Edition: Remove-Item .vercel -Recurse -Force; vercel link --yes --project $PrivateProject; vercel env add MUSEUM_EDITION production; vercel --prod"
      if (-not $DryRun) {
        throw "Vercel CLI ('vercel') is required for automated deployment."
      }
    }

    Write-Host ""
    Write-Host "Reminder: Configure cloud & payment keys in Vercel (never commit secrets):" -ForegroundColor DarkYellow
    Write-Host "  UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (required for persistent rooms)"
    Write-Host "  PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY (optional live Nigerian checkout)"
    Write-Host "  FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY (optional live Flutterwave)"
    Write-Host "  MOR_CHECKOUT_URL (optional Lemon Squeezy / Merchant of Record URL)"

    # Deploy URL 1: Public Edition (MUSEUM_EDITION=public)
    if (Test-Path -LiteralPath ".vercel") {
      Invoke-Step "Clear existing .vercel link before linking Public project" {
        Remove-Item -LiteralPath ".vercel" -Recurse -Force
      }
    }
    Invoke-Step "Link Public Edition Vercel project ($PublicProject)" {
      vercel link --yes --project $PublicProject
    }
    Invoke-Step "Ensure MUSEUM_EDITION=public on production" {
      $null = cmd /c "vercel env rm MUSEUM_EDITION production --yes 2>nul"
      "public" | vercel env add MUSEUM_EDITION production
    }
    Invoke-Step "Deploy Public Edition to Vercel production" {
      vercel --prod --yes
    }

    # Deploy URL 2: Private Founders Edition (MUSEUM_EDITION=private)
    if (Test-Path -LiteralPath ".vercel") {
      Invoke-Step "Clear .vercel link before linking Private Founders project" {
        Remove-Item -LiteralPath ".vercel" -Recurse -Force
      }
    }
    Invoke-Step "Link Private Founders Vercel project ($PrivateProject)" {
      vercel link --yes --project $PrivateProject
    }
    Invoke-Step "Ensure MUSEUM_EDITION=private on production" {
      $null = cmd /c "vercel env rm MUSEUM_EDITION production --yes 2>nul"
      "private" | vercel env add MUSEUM_EDITION production
    }
    Invoke-Step "Deploy Private Founders Edition to Vercel production" {
      vercel --prod --yes
    }
  }

  Write-Host ""
  Write-Host "Done! Share your Public & Private URLs from Vercel above." -ForegroundColor Green
}
finally {
  Pop-Location
}
