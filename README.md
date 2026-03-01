# Java MCP Tools

VSCode/Cursor 扩展，提供 **Java 相关 MCP 工具**，供 MCP 客户端（如 Cursor）通过 [VSCode MCP Bridge](https://github.com/yutengjing/vscode-mcp-bridge) 调用。基于 redhat.java 的 `jdt://` 解析 classpath，实现按类名查 jar 路径与反编译类源码。

## MCP 工具

| 工具 | 说明 |
|------|------|
| `get_jar_path` | 根据一个或多个 Java 类名（全限定名或简单类名）查找其所在 jar 的绝对路径 |
| `get_class_content` | 根据类名从 jar 依赖中反编译并返回可读的 Java 源码 |

## 依赖

- [redhat.java](https://marketplace.visualstudio.com/items?itemName=redhat.java)：提供 Java 语言支持与 `jdt://` URI 解析
- [VSCode MCP Bridge](https://marketplace.visualstudio.com/items?itemName=yutengjing.vscode-mcp-bridge)：提供 MCP 协议桥接

## 安装

```bash
# 复制到扩展目录
cp -r java-mcp-tools ~/.vscode/extensions/
# 或 Cursor
cp -r java-mcp-tools ~/.cursor/extensions/

# 安装完成后重启 VSCode/Cursor
```

或在扩展市场安装（若已发布）。

## 使用

在已配置 MCP 并启用本扩展与 VSCode MCP Bridge 的 Cursor/其他 MCP 客户端中，可直接调用上述工具，例如根据类名查 jar 或查看反编译后的类内容。

## 激活条件

- 工作区包含 Java 相关文件（如 `**/pom.xml`、`**/build.gradle`）或打开 Java 文件时激活
