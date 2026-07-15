#!/bin/bash
# 将建筑图片上传到 Cloudflare R2
# 用法：
#   1. 在 Cloudflare Dashboard → R2 → Manage R2 API Tokens 创建 Token
#   2. export R2_ACCESS_KEY_ID="你的Access Key ID"
#   3. export R2_SECRET_ACCESS_KEY="你的Secret Access Key"
#   4. bash scripts/upload-to-r2.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGES_DIR="$PROJECT_DIR/frontend/public/buildings"

# R2 Endpoint (从 Cloudflare Dashboard → R2 → nuaamap-buildings 获取)
ENDPOINT="https://7738e6fd89aa7de18fa8742bfe6f8b6d.r2.cloudflarestorage.com"
BUCKET="nuaamap-buildings"

if [ -z "${R2_ACCESS_KEY_ID:-}" ] || [ -z "${R2_SECRET_ACCESS_KEY:-}" ]; then
  echo "错误：请先设置环境变量："
  echo "  export R2_ACCESS_KEY_ID=\"你的Access Key ID\""
  echo "  export R2_SECRET_ACCESS_KEY=\"你的Secret Access Key\""
  exit 1
fi

if [ ! -d "$IMAGES_DIR" ]; then
  echo "错误：找不到图片目录 $IMAGES_DIR"
  exit 1
fi

echo "目标: $ENDPOINT/$BUCKET"
echo "源: $IMAGES_DIR"
echo ""

SUCCESS=0
FAILED=0

# 遍历所有建筑图片
while IFS= read -r -d '' FILE; do
  REL_PATH="${FILE#$IMAGES_DIR/}"
  OBJECT_KEY="buildings/$REL_PATH"

  # 用 curl 的 AWS SigV4 签名上传到 R2（R2 兼容 S3 API）
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PUT \
    --data-binary @"$FILE" \
    --aws-sigv4 "aws:amz:auto:s3" \
    --user "$R2_ACCESS_KEY_ID:$R2_SECRET_ACCESS_KEY" \
    "$ENDPOINT/$BUCKET/$OBJECT_KEY" 2>&1)

  if [ "$HTTP_CODE" = "200" ]; then
    SUCCESS=$((SUCCESS + 1))
    echo "  ✓ $REL_PATH"
  else
    FAILED=$((FAILED + 1))
    echo "  ✗ $REL_PATH (HTTP $HTTP_CODE)"
  fi
done < <(find "$IMAGES_DIR" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) -print0)

echo ""
echo "上传完成：成功 $SUCCESS，失败 $FAILED"
