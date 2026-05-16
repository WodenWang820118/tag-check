# 介绍

在这里，你可以了解 TagCheck 的用途，以及如何使用这个应用。

## 快速开始

本节会带你完成上手所需的基本步骤，并说明 TagCheck 如何协助你管理 Google Tag Manager（GTM）标签审计项目。

## 项目

本节会介绍如何在系统中创建与管理项目，包括创建新项目、加入标签、执行审计，以及编辑或删除项目等管理功能。

## 设置

本节会说明如何按需求调整系统设置，内容包括：

- 项目信息
- 验证
- 预载数据
- Browser Arguments
- Google Tag Manager 与请求拦截设置
- 项目导入与导出

## TagCheck 的工作方式

下面简要说明 TagCheck 的核心工作流程。

## Puppeteer

Puppeteer 是一个 Node.js 库，提供高级 API，通过 DevTools Protocol 控制无头 Chrome 或 Chromium。TagCheck 利用它执行浏览器自动化审计，也能同时操作多个浏览器实例，以满足质量保证流程的需求。

## Chrome Recorder

Chrome Recorder 是用于记录用户浏览器操作并生成 Puppeteer 脚本的工具。TagCheck 会使用 Recorder 输出的 JSON 格式重放操作流程，并由 Puppeteer 执行审计。

## 审计流程

当用户执行审计时，系统会创建新的浏览器实例并重放录制好的操作流程，随后检查标签是否正确触发，最后生成审计报告。报告会列出未正确触发的标签以及失败原因。
