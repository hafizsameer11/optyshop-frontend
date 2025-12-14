# Clear Vite Cache - Quick Fix

## The Problem
Vite is trying to load `/src/data/lensCustomizationData.ts` but the file is now `.tsx`. This is a cache issue.

## Solution

### Option 1: Restart Dev Server (Recommended)
1. Stop the dev server (Ctrl+C)
2. Delete the cache:
   ```powershell
   Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
   ```
3. Restart:
   ```powershell
   npm run dev
   ```

### Option 2: Hard Refresh Browser
1. Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
2. This forces a hard refresh and clears browser cache

### Option 3: Clear All Caches
```powershell
# Stop dev server first (Ctrl+C)

# Clear Vite cache
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue

# Clear any .vite folder in root (if exists)
Remove-Item -Path ".vite" -Recurse -Force -ErrorAction SilentlyContinue

# Restart
npm run dev
```

## Why This Happened
The file was renamed from `.ts` to `.tsx` to support JSX syntax. Vite's module resolution cache still had the old `.ts` reference. After clearing the cache, Vite will correctly resolve the `.tsx` file.

