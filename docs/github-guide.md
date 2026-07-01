# GitHub 协作入门指南 — 从零开始

> 写给不太熟悉 Git/GitHub 的团队成员。跟着做一遍就会了。

## 第一步：安装 Git

### Windows
1. 下载：https://git-scm.com/download/win
2. 双击安装，一路点"下一步"，全部默认即可
3. 安装完后，在桌面右键 → 选择 "Open Git Bash Here"，输入：
   ```bash
   git --version
   ```
   看到版本号说明安装成功。

### Mac
```bash
brew install git
```
或下载：https://git-scm.com/download/mac

---

## 第二步：配置身份

打开 Git Bash（或终端），设置你的名字和邮箱（用 GitHub 注册的邮箱）：

```bash
git config --global user.name "你的姓名"
git config --global user.email "你的GitHub邮箱"
```

---

## 第三步：克隆仓库到本地

1. 确保你已被邀请为仓库协作者（仓库 Settings → Collaborators → 添加每个人的 GitHub 账号）
2. 打开 Git Bash，进入你想放项目的目录，比如桌面：
   ```bash
   cd ~/Desktop
   ```
3. 克隆仓库：
   ```bash
   git clone https://github.com/programmingWTF/nuaa-map.git
   cd nuaa-map
   ```

现在你本地就有了一份项目代码。

---

## 第四步：创建你的分支

**永远不要在 main 分支上直接修改代码！** 每次工作前创建自己的分支：

```bash
git checkout main              # 先切到 main
git pull origin main           # 拉取最新代码
git checkout -b 你的分支名      # 创建并切换到新分支
```

### 分支命名规则（按小组）

| 你的组 | 分支前缀 | 示例 |
|--------|----------|------|
| ① 地图美工 | `map/` | `map/base-layer-v2` |
| ② 交互功能 | `interact/` | `interact/building-popup` |
| ③ 平台搭建 | `platform/` | `platform/project-init` |
| ④ 数据收集 | `data/` | `data/dorm-east` |
| ⑤ 智能体 | `ai/` | `ai/rag-setup` |
| ⑥ 数据转换 | `convert/` | `convert/geojson-script` |

---

## 第五步：改代码 + 提交

### 5.1 改代码

用你喜欢的编辑器（VS Code 推荐）打开项目文件夹，修改文件。

### 5.2 查看改了什么

```bash
git status          # 看改了哪些文件
git diff            # 看具体改了什么内容
```

### 5.3 暂存改动

```bash
git add 文件路径     # 添加单个文件
git add .           # 添加所有改动（小心别把不该提交的也加了）
```

### 5.4 提交

```bash
git commit -m "feat(你的组): 做了什么"
```

提交信息格式（参考 CONTRIBUTING.md）：

```
<类型>(<范围>): <简短描述>
```

**类型**：`feat`（新东西）、`fix`（修bug）、`data`（数据）、`asset`（图片素材）、`docs`（文档）

**示例**：
```bash
git commit -m "data(map): 添加东区宿舍信息"
git commit -m "feat(interact): 点击建筑弹出详情面板"
git commit -m "asset(map): 更新校园底图 v2"
git commit -m "fix(interact): 修复地图缩放后标记偏移问题"
```

> ⚠️ 如果提交信息写错了，用 `git commit --amend -m "新的正确信息"` 修改。

---

## 第六步：推送到 GitHub

```bash
git push origin 你的分支名
```

例如：
```bash
git push origin data/dorm-east
```

第一次 push 某个分支时可能会提示：
```
fatal: The current branch has no upstream branch.
```
复制提示里的命令执行即可：
```bash
git push --set-upstream origin data/dorm-east
```

---

## 第七步：创建 Pull Request（PR）

1. 打开 https://github.com/programmingWTF/nuaa-map
2. 页面顶部会看到黄色提示条 "你的分支名 had recent pushes"，点击 **Compare & pull request**
3. 如果没有提示条，点 **Pull requests** 标签 → **New pull request**
4. 设置：
   - **base**: `main`（合并到哪里）
   - **compare**: 你的分支（从哪里合并）
5. 填写标题和描述，说清楚做了什么
6. 点 **Create pull request**
7. 在群里 @ 同组的同学帮忙 Review

---

## 第八步：Review 与合并

- 等至少一个人在你的 PR 页面点 **Approve**
- 如果 Review 的人提了修改意见，在本地改完后 `git add` → `git commit` → `git push`，PR 会自动更新
- 通过后点 **Merge pull request** 合并

---

## 日常工作的完整流程

以后每次改代码都走这个流程：

```bash
# 1. 切到 main 并拉最新
git checkout main
git pull origin main

# 2. 创建新分支
git checkout -b 你的分支名

# 3. 改代码...

# 4. 查看改动
git status
git diff

# 5. 暂存 + 提交
git add .
git commit -m "feat(组): 描述"

# 6. 推送
git push origin 你的分支名

# 7. 去 GitHub 网页创建 PR
```

---

## 常见问题排查

### Q: 提交时提示 "Please tell me who you are"
运行第四步的身份配置命令。

### Q: push 时提示 "Permission denied"
说明你的 GitHub 账号没有被添加为仓库协作者，联系仓库管理员添加。

### Q: push 时提示 "failed to push, the remote contains work..."
说明别人在你之前 push 了新代码。先拉取再 push：
```bash
git pull origin main
git push origin 你的分支名
```

### Q: 合并时有冲突（conflict）
别慌。冲突意味着你和别人改了同一个文件的同一行。
1. 打开冲突文件，会看到类似这样的标记：
   ```
   <<<<<<< HEAD
   你的代码
   =======
   别人的代码
   >>>>>>> 分支名
   ```
2. 手动删除标记，保留最终想要的代码
3. 保存文件后：
   ```bash
   git add .
   git commit -m "fix: 解决合并冲突"
   git push origin 你的分支名
   ```

### Q: 我不小心在 main 分支上改了代码
```bash
git stash              # 暂存改动
git checkout -b 新分支名 # 创建新分支
git stash pop          # 恢复改动到新分支
```
然后正常提交即可。

### Q: 提交信息写错了想改
```bash
git commit --amend -m "正确信息"
git push --force-with-lease origin 你的分支名
```

### Q: 我想放弃本地的所有改动
```bash
git checkout .        # 放弃所有未暂存的改动
git clean -fd         # 删除新增的未跟踪文件
```

---

## 推荐工具

- **VS Code**：内置 Git 图形界面，左侧 Source Control 面板可以可视化操作
- **GitHub Desktop**：https://desktop.github.com/ — 纯图形界面，不用敲命令，适合完全不想碰命令行的同学
- **GitLens**（VS Code 插件）：可视化每行代码是谁写的、什么时候改的

---

## 小贴士

1. **勤提交**：不要攒几百行再提交，改完一个小功能就提交一次
2. **勤 pull**：每天开始工作前先 `git pull`，减少冲突概率
3. **一个分支只做一件事**：不要在一个分支里既加地图又改智能体
4. **先 pull 再 push**：push 前先 `git pull origin main` 确保没有冲突
5. **别 panic**：Git 几乎所有操作都可以撤销，不要把整个文件夹删了重来
