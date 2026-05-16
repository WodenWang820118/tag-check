# 报告管理

每一份 report 都代表一个测试用例，并包含多个相关组件。它提供整体测试脉络，也让用户能按需要查看或调整内容。

- 状态栏：在详细报告页面中，会显示精简的测试状态摘要
- 屏幕截图：提供事件触发当下或事件触发后的视觉证据
- 视频录制：保留测试用例的执行过程，方便调试与理解流程
- 仪表板：报告面板包含以下内容
  - Data Layer Spec
  - Chrome Recording
  - Raw Request
  - Request Data Layer
  - Data Layer
  - Destination URL

## Reports

每次测试成功执行后，系统都会把 report 保存在应用中，并可通过侧边栏的 `Reports` 菜单查看或导出为 XLSX。导出内容会包含上述信息，但不含视频录制，并明确标示每个测试用例是通过还是失败。你也可以一次下载多份报告。
