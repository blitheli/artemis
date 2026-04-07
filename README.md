# Artemis II 飞行演示

使用 **Vite + TypeScript + React Three Fiber** 搭建的 Artemis II（猎户座载人绕月）任务**示意性**三维展示：地球与月球、奔月/返航轨迹、猎户座简化模型，以及可拖拽时间轴与阶段说明。

> 轨迹与时间为教学可视化，**非** NASA 精密星历或实时任务数据。

## 开发

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址即可。

## 构建

```bash
npm run build
npm run preview
```

## 操作

- **拖拽「任务进度」滑块**：沿任务时间线查看各阶段。
- **播放 / 暂停**：自动沿轨迹前进（循环）。
- **阶段圆点**：快速跳到对应阶段起点。
- **鼠标拖拽 / 滚轮**：旋转与缩放三维视角（OrbitControls）。

贴图从 `threejs.org` 示例纹理加载；离线环境可改为本地 `public` 资源。
