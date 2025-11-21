#!/bin/bash

echo "🔍 TypeScript Diagnosis Script"
echo "============================="
echo ""

echo "📁 Checking file structure..."
echo "Files that should NOT exist (phantom errors):"
if [ -d "app/signup/tasks" ]; then
  echo "❌ app/signup/tasks/ exists (should not)"
else
  echo "✅ app/signup/tasks/ does not exist (correct)"
fi

if [ -d "app/what-type-of-org-are-you" ]; then
  echo "❌ app/what-type-of-org-are-you/ exists (should not)"
else
  echo "✅ app/what-type-of-org-are-you/ does not exist (correct)"
fi

echo ""
echo "Files that SHOULD exist:"
if [ -d "app/(auth)/sign-up/tasks" ]; then
  echo "✅ app/(auth)/sign-up/tasks/ exists (correct)"
else
  echo "❌ app/(auth)/sign-up/tasks/ missing (problem)"
fi

if [ -f "convex/_generated/api.d.ts" ]; then
  echo "✅ convex/_generated/api.d.ts exists (correct)"
else
  echo "❌ convex/_generated/api.d.ts missing (problem)"
fi

echo ""
echo "🔧 Running TypeScript compilation check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✅ TypeScript compilation successful"
else
  echo "❌ TypeScript compilation failed"
fi

echo ""
echo "💡 If VS Code still shows errors after this script:"
echo "   1. Restart VS Code completely (Cmd+Q, then reopen)"
echo "   2. In VS Code: Cmd+Shift+P → 'TypeScript: Restart TS Server'"
echo "   3. Clear VS Code workspace: rm -rf .vscode/"
echo "   4. Check if multiple VS Code windows are open to this project"