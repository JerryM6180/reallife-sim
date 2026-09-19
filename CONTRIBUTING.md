# 怎么一起做这个游戏

先记住一件事：**`main` 分支就是线上试玩。** GitHub Pages 直接从 `main` 出，合进去一分钟后，
<https://jerrym6180.github.io/reallife-sim/> 上的人玩到的就是你的改动。所以 `main` 上的东西必须永远能玩。

下面所有规矩都是从这一条推出来的。

---

## 日常流程

第一次：

```bash
git clone https://github.com/JerryM6180/reallife-sim.git
cd reallife-sim
```

之后每做一件事，都是这五步：

```bash
# 1. 从最新的 main 开一个分支
git switch main
git pull
git switch -c content/teacher-events

# 2. 改。本地跑起来看（见 README「怎么跑起来」），亲眼见过再提交
git add -A
git commit -m "教师线：补 6 条岗位事件"

# 3. 推上去
git push -u origin content/teacher-events
```

4. 打开 GitHub，它会提示你开 Pull Request。开。
5. 等两件事：**机器人跑绿**（自动的，一分钟以内）＋ **另一个人点 Approve**。然后点 Squash and merge，分支会自动删掉。

`main` 不能直接 push，会被拒。这不是不信任谁 —— 是因为 `main` 坏了，试玩链接就坏了。

### 分支怎么起名

`类别/做什么`，类别跟 issue 标签是同一套：

| 前缀 | 用来 |
|---|---|
| `content/` | 职业线、岗位、事件、文案 |
| `balance/` | 调数值 |
| `ui/` | 界面 |
| `engine/` | 引擎逻辑 |
| `fix/` | 修 bug |

分支要短命。一个分支做一件事，一两天内合掉。挂一个星期的分支，合的时候一定冲突。

---

## 怎么不撞车

Git 在两个人改**不同文件**的时候合并得很干净，改**同一个文件的同一段**的时候就要手动解冲突。
这个项目里有两个文件最容易撞：

- **`js/content.js`**（1900 多行）—— 谁都想往里加东西。
  **新内容开新文件**：`jobevents_d.js`、`events3.js`、`tracks_d.js`。
  照着现有文件的开头抄那几行 `(function (global) { ... })(window);` 就行，
  然后在 `index.html` 和 `build.py` 里各登记一行（漏了机器人会告诉你）。
  只有改**已有的**城市、出身、行动、岗位时才动 `content.js`，而且动之前先开 issue 说一声。
- **`js/engine.js`** —— 回合循环很脆，两个人同时动 `settle()` 一定出事。
  它有固定负责人（见 `.github/CODEOWNERS`），要改先开 issue 聊。

动手之前**先认领**：Issues → New issue →「认领一块活」，把自己设成 Assignee。
这样不会出现两个人各写了一套律师线事件。

---

## 机器人查什么

每个 PR 会自动跑 `tools/bot.js`：五种活法的机器人轮着活 300 辈子，什么按钮都点。它会拦住：

- 语法错误（漏逗号、漏括号）—— 精确到文件和行
- 新文件忘了登记进 `index.html` / `build.py`
- id 重复的事件、岗位、职业线
- 岗位事件的线名写错（`J('docter', …)` —— 不报错，只是永远不触发，最难发现的那种）
- 文案里漏出来的 `undefined` / `NaN`
- 触发条件 `when` / `cond` 里抛的异常（引擎会默默吞掉，机器人不吞）
- 钱、健康、压力变成 `NaN` 或出界
- 一个选项都没有的选择（玩家会卡死）
- **同种子不再复现** —— 有人用了 `Math.random()`，或者事件里改到了共享的内容数据

红了就点进去看日志，每条问题后面都带着重放命令。装了 Node 的话本地也能跑：

```bash
node tools/bot.js
```

没装也没关系，推上去 GitHub 会替你跑。

机器人查不了的：**写得好不好、数值合不合理、界面好不好看。** 这是审 PR 的人的事。

---

## 审 PR 看什么

不用逐行读。看这几样：

1. 拉下分支，自己玩几分钟，改到的地方亲眼看一遍
2. 文案：具体、克制、不煽情；每个选项都有代价，没有纯赚的那一项（见 README「设计原则」）
3. 随机只从 `rng` 取
4. 内容 PR 有没有顺手改了 `engine.js` —— 有的话请拆成两个 PR

小 PR 当天审完。PR 越小越好审，一个 PR 200 行以内最理想。

---

## 报 bug

Issues → New issue →「报 bug」。**一定要带种子**（游戏画面顶上：`第 N 格 · 种子 …`）。
同种子 + 同样的选择 = 一模一样的人生，所以有种子的 bug 一定能重现，没种子的 bug 基本只能靠猜。

---

## 版本

想留一个稳定版本给别人看（比如发给发行商、参展）的时候打 tag：

```bash
git tag v0.2-demo
git push origin v0.2-demo
```

Pages 永远跟着 `main` 走；tag 只是一个「那天长这样」的书签。
