# H5 活动页多语言物料规格

> 来源：Figma 文件 `jOWb7AgUgSPbnDTIk8SZ8o`（物料尺寸/规格）  
> 提取日期：2026-04-17 | 更新日期：2026-04-21

---

## 1. 物料总览

| 物料 ID | 尺寸（px） | 用途说明 |
|---|---|---|
| `头图` | 750 × 900 | H5 活动页头图 |
| `splash_2x` | 720 × 1280 | 开屏图 @2x（Android 标准） |
| `splash_3x` | 1080 × 1920 | 开屏图 @3x（Android 高清） |
| `splash_2400` | 1080 × 2400 | 开屏图（全面屏/长屏） |
| `banner` | 750 × 260 | 横幅广告（站内 Banner） |
| `sharing` | 360 × 360 | 社交分享图（正方形） |
| `popup` | 840 × 1080 | 活动弹窗 |
| `push` | 128 × 108（导出 384×324 @3x） | 推送通知图标 |
| `tag_s` | 70 × 24（导出 210×72 @3x） | 礼物角标标签 |
| `tag_l` | 90 × 24（导出 270×72 @3x） | 道具角标标签 |
| `loudspeaker_bg` | 624 × 80 | 大喇叭公告条背景（含蒙层） |
| `loudspeaker_icon` | 72 × 72 | 大喇叭左侧角色图标（透明底 PNG） |

---

## 2. 背景图规范

**所有物料背景图均由 活动主题 背景图（`header_topic.png`）延展生成**，不单独设计各物料背景。

生成规则：裁切并居中缩放至目标尺寸（ImageMagick `-gravity center -extent`）：

```bash
magick header_topic.png -resize 750x900^   -gravity center -extent 750x900   backgrounds/头图_bg.png
magick header_topic.png -resize 720x1280^  -gravity center -extent 720x1280  backgrounds/splash_2x_bg.png
magick header_topic.png -resize 1080x1920^ -gravity center -extent 1080x1920 backgrounds/splash_3x_bg.png
magick header_topic.png -resize 1080x2400^ -gravity center -extent 1080x2400 backgrounds/splash_2400_bg.png
magick header_topic.png -resize 750x260^   -gravity center -extent 750x260   backgrounds/banner_bg.png
magick header_topic.png -resize 360x360^   -gravity center -extent 360x360   backgrounds/sharing_bg.png
magick header_topic.png -resize 840x1000^  -gravity center -extent 840x1000  backgrounds/popup_bg.png
magick header_topic.png -resize 384x324^   -gravity center -extent 384x324   backgrounds/push_bg.png
```

---

## 3. 通用视觉样式规范

### 3.A 标题文字 — 双层叠加描边技法

所有物料中主标题（`#Title.1`）采用**两层文字叠加**渲染，模拟「带描边的金色渐变」效果。

| 层级 | 描边 | 填充 | 说明 |
|---|---|---|---|
| 第一层（底层） | `stroke_width=6`，黑色 | 黑色 | 形成 6px 居中黑色外轮廓 |
| 第二层（上层） | 无描边 | 金色渐变（top→bottom） | 覆盖底层中心区域 |

金色渐变色值：`(255,255,190)` → `(255,210,0)` → `(180,100,5)`

### 3.B 副标题文字 — 双层叠加描边技法

所有物料中副标题（`#Sub-Title.1`）字重固定为 **Bold**，双层叠加。

| 层级 | 描边 | 填充 | 说明 |
|---|---|---|---|
| 第一层（底层） | `stroke_width=4`，白色 | 白色 | 4px 居中白色外轮廓 |
| 第二层（上层） | 无描边 | 黑色 `(0,0,0,255)` | 覆盖底层中心区域 |

**字重约束：** 所有语言副标题统一使用 **Bold** 字重字体。

### 3.C 按钮（CTA Button）— 统一视觉规范

| 属性 | 值 |
|---|---|
| **填充渐变**（竖向） | `(249,255,184)` 0% → `(251,255,101)` 45% → `(255,175,21)` 100% |
| **描边渐变**（OUTSIDE，3px） | `(255,255,255)` 0% → `(255,161,22)` 48% → `(200,96,0)` 100% |
| **圆角** | **60px**（固定值） |
| **内阴影** | offset=(0,4), blur=4, 白色 |
| **投影** | offset=(0,4), blur=0, `(203,110,0)` 深琥珀 |
| 文字颜色 | `(60,5,0,255)` 深棕红 |
| 文字字重 | Bold，水平垂直居中 |

各物料按钮尺寸：

| 物料 | 按钮尺寸 | 位置 (x, y) | 文字字号 |
|---|---|---|---|
| splash_2x | 400 × 90 | (160, 970) | 32px |
| splash_3x | 600 × 135 | (240, 1440) | 48px |
| splash_2400 | 640 × 144 | (220, 1766) | 48px |
| banner | 280 × 48 | (365, 190) | 24px |
| sharing | 280 × 48 | (40, 272) | 24px |
| popup | 600 × 100 | (120, 920) | 40px |

### 3.D Banner 日期徽章 — 固定样式

| 属性 | 值 |
|---|---|
| 尺寸 | **204 × 40 px** |
| 位置 | 左下角，`y = banner高度 - 40` |
| 圆角 | **仅右上角 40px**（左上/左下/右下 = 0px） |
| 背景 | 黑色半透明 `(0,0,0,160)` |
| 文字 | Roboto Bold 20px，水平居中，白色，不随语言切换 |

实现方式：全圆角矩形，再把左上/左下/右下三角补回方角（`corner = min(r, bh//2)`）。

Banner 右侧文字布局规则：
- **Sub-Title y 固定：距 banner 底部 130px**：`sub_y = banner_height - 130`
- **Title y 向上动态推算**：`title_y = sub_y - title_h - 26px`（title_h 由实际行高 auto 决定）
- title 与 sub_title 行高均为 **auto**（由字体渲染自然高度决定，不固定行高）
- Title → Sub-Title 间距：固定 **26px**（所有语言一致）
- **Button y 固定：距 banner 底部 28px**：`btn_y = banner_height - 28 - btn_height`

### 3.E 分享图（Sharing）— 自动主体色遮罩

背景图上方统一叠加半透明遮罩，颜色根据背景图主体色自动生成：
- 背景图缩小至 50×50px，取像素 HSV 均值（忽略高亮区域）
- 降低饱和度 30%、亮度 30%，alpha 固定为 **140**

### 3.F 多语言特殊字体

| 语言 | 字体文件 | 备注 |
|---|---|---|
| `ar` / `ur` | `NotoNaskhArabic-VariableFont_wght.ttf` | Pillow 无 libraqm，Nastaliq 无法渲染；Naskh + arabic_reshaper + bidi 正常 |
| `ta` | `HindMadurai-Bold.ttf` | Hind Madurai Bold |
| `te` | `HindGuntur-Bold.ttf` | Hind Guntur Bold |
| `zh_Hans` | `PingFang.ttc`，index=8 | SC Semibold，最粗可用 |
| `hi` | `NotoSansDevanagariUI-Bold.ttf` | |
| `bn_BD` | `NotoSansBengali-Bold.ttf` | |

ar/ur 文字必须经过字形重组：`get_display(arabic_reshaper.reshape(text))`，对齐方式统一为**水平居中**，不使用 RTL 位移。

---

## 4. 各物料详细规格

### 4.1 头图（750 × 900 px）

| 区域 | 尺寸 | 位置 (x, y) | 说明 |
|---|---|---|---|
| 背景 | 750×900 | (0, 0) | HeaderTopic 图延展 |
| 非安全区（左/右） | 60px | — | x < 60 或 x > 690 不放内容 |
| 日期 badge | 204×40 | (居中, title_y-60) | **四角均 40px 圆角**；badge_y = title_y - 20 - 40；Roboto Bold |
| 主标题 | 630×auto | (60, 295) | 双层描边渐变（§3.A） |
| 副标题 | 630×auto | (60, 385) | 双层白描边黑填充 Bold（§3.B） |

文字规范：日期 Roboto Bold 20px；标题初始 80px Black；副标题 30px Bold；均水平居中，宽度限 630px。

### 4.2 开屏图 @2x（720 × 1280 px）

安全区 x=80~640（560px）；标题 y=342，副标题 y=452，按钮 y=970。  
标题初始 80px Black，副标题 24px Bold，按钮文字 32px Bold。

### 4.3 开屏图 @3x（1080 × 1920 px）

安全区 x=130~950（820px）；标题 y=385，副标题 y=558，按钮 y=1440。  
标题初始 120px Black，副标题 32px Bold，按钮文字 48px Bold。

### 4.4 开屏图 全面屏（1080 × 2400 px）

安全区 x=130~950（820px）；标题 y=372，副标题 y=562，按钮 y=1766。  
标题初始 140px Black，副标题 48px Bold，按钮文字 48px Bold。

### 4.5 横幅广告 banner（750 × 260 px）

布局：左半为 HeaderTopic 视觉延展区，右半（x=290起）为文字区。

| 区域 | 尺寸 | 位置 (x, y) | 说明 |
|---|---|---|---|
| 日期徽章 | 204×40 | (0, 220) | 仅右上角 40px 圆角（§3.D） |
| 非安全区（右） | 30px | x > 720 | |
| 主标题 | 430×auto | (290, title_y) | 行高 auto；title_y = sub_y - title_h - 26 |
| 副标题 | 430×auto | (290, sub_y) | 行高 auto；**sub_y = banner_height - 130**（固定距底） |
| CTA 按钮 | 280×48 | (365, btn_y) | btn_y = 260 - 28 - 48 = 184 |

文字：日期 20px Bold；标题初始 56px Black；副标题 24px Bold；按钮 24px Bold。  
布局计算顺序：① 确定 sub_y = 260 - 130 = 130 → ② title_y = sub_y - title_h - 26

**按钮文案垂直对齐规则：**
- 默认：文案与按钮背景垂直居中对齐
- ar / ur：在居中基础上再向上偏移 6px（阿拉伯字形视觉重心偏低，需补偿）

### 4.6 社交分享图 sharing（360 × 360 px）

自动主体色半透明遮罩（§3.E）铺满全图；文字区 300×auto，x=30，y=121；CTA 按钮 y=272。  
分享文案 Roboto Bold **24px**，白色，字号固定 24px（不随内容长度缩放），宽度限 300px，超出自动折行。

### 4.7 活动弹窗 popup（840 × 1080 px）

| 区域 | 尺寸 | 位置 (x, y) | 说明 |
|---|---|---|---|
| 透明画布 | 840×1080 | — | RGBA，初始全透明 |
| 背景图 | 840×1000 | (0, 80) | HeaderTopic 延展，圆角 40px（四角均圆） |
| 非安全区（左/右） | 60px | — | |
| 主标题 | 720×150 | (60, 20) | 悬浮于透明区，跨越 y=80 边界 |
| 描述文字 | 800×auto | (20, 848) | Bold，双层结构（§3.B） |
| CTA 按钮 | 600×100 | (120, 920) | 距底部固定 60px |

**导出规则：直接调用 `canvas.save(path)` 保留 RGBA 透明通道，禁止 `.convert("RGB")`。**

文字：标题初始 100px Black；描述文字 28px Bold；按钮 36px Bold。

### 4.8 推送图标 push（128 × 108 px，导出 384 × 324 px @3x）

纯图像物料，无文字。背景图在生成阶段直接输出 @3x 尺寸（384×324）。

### 4.9 角标标签 tag_s / tag_l

| 物料 | 设计尺寸 | 导出尺寸 | 圆角（@1x） | 圆角（@3x 渲染） |
|---|---|---|---|---|
| tag_s | 70 × 24 px | 210 × 72 px @3x | **4px** | **12px** |
| tag_l | 90 × 24 px | 270 × 72 px @3x | **8px** | **24px** |

- 圆角需对最终合成图（背景 + 文字覆盖层）整体应用 `apply_rounded_mask()`，保留 RGBA 透明通道导出
- 文字样式：**单层白色填充 + 半透明投影**（偏移 +2px，fill=(0,0,0,120)），不使用双层描边
- 文字字体：Roboto Black，初始字号 36px（@3x 坐标系），宽度限制 W-12px
- 仅导出英文版本

### 4.10 大喇叭 loudspeaker（624 × 80 px）

公告滚动条物料，分两个独立文件输出：

| 文件 | 尺寸 | 格式 | 说明 |
|---|---|---|---|
| `loudspeaker_bg.png` | 624 × 80 px | 压缩 PNG（RGB） | HeaderTopic 背景截图 + 半透明绿色蒙层（rgba 18,90,42,160） |
| `loudspeaker_icon.png` | 72 × 72 px | 透明底 PNG（RGBA） | 3D 游戏风格金羊角色，rembg 去背景 |

- 背景裁切方式：`magick_tag_crop`，从源图中心区域截取，保持比例缩放
- 蒙层颜色：`rgba(18, 90, 42, 0.63)`（alpha 160/255）
- icon 来源：`tag_sheep.png` 缩放至 72×72，保留透明通道
- 仅导出英文版本，保存至 `preview/en/loudspeaker_bg.png` 和 `preview/en/loudspeaker_icon.png`

---

## 5. 标题文字多语言自适应规则

| 规则 | 说明 |
|---|---|
| **宽度固定** | 文字容器宽度锁定，不超出安全区 |
| **字号弹性** | 超宽时每次缩小 2px，最小字号 = 初始字号 × 0.6 |
| **高度自适应** | 字号确定后高度跟随行高扩展 |

---

## 6. 非安全区汇总

| 物料 | 左侧 | 右侧 |
|---|---|---|
| 头图 | 60px | 60px |
| 开屏 @2x | 80px | 80px |
| 开屏 @3x / 全面屏 | 130px | 130px |
| banner | 无 | 30px |
| sharing | 无 | 无 |
| popup | 60px | 60px |
| push / tag | 无 | 无 |
| loudspeaker_bg | 无 | 无 |
| loudspeaker_icon | 无 | 无 |
