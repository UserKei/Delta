# GSAP Animation Stack UI 实施方案 (多包架构)

本方案采用分层架构，将基础 UI 组件与复杂动画逻辑解耦。

---

## 1. 基础 UI 层 (`packages/ui-shadcn`)

该包作为全仓库的 UI 规范，存放标准的 shadcn-vue 组件，供 `ui-animation` 和 `apps/web` 使用。

### 1.1 初始化与安装

1. **创建目录**: `mkdir -p packages/ui-shadcn/src/{components/ui,lib,assets}`
2. **安装核心依赖**:

```bash
# 在 packages/ui-shadcn 下执行
bun add vue radix-vue lucide-vue-next clsx tailwind-merge class-variance-authority
```

3. **配置 `components.json`**:
   为了让 `shadcn-vue` CLI 知道组件安装到哪里，需要配置别名：

```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 1.2 核心工具与组件添加

- **工具类 (`src/lib/utils.ts`)**:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- **添加组件**: 执行 `npx shadcn-vue@latest add card badge`。
- **统一导出 (`src/index.ts`)**:

```typescript
export * from './components/ui/card'
export * from './components/ui/badge'
export { cn } from './lib/utils'
```

### 1.3 样式配置 (关键)

1. **全局样式 (`src/assets/globals.css`)**:
   将 shadcn 生成的 CSS 变量（`:root { --primary: ... }`）放在这里。
2. **Tailwind 配置**:
   在 `packages/ui-shadcn` 中维护一个 `tailwind.config.js` 作为 preset，或者在根目录的配置中扫描该包：

```js
// apps/web/tailwind.config.js
content: [
  './index.html',
  './src/**/*.{vue,js,ts,jsx,tsx}',
  '../../packages/ui-shadcn/src/**/*.{vue,js,ts,jsx,tsx}',
  '../../packages/ui-animation/src/**/*.{vue,js,ts,jsx,tsx}',
]
```

---

## 2. 动画组件层 (`packages/ui-animation`)

该包专注于 PDA 相关的动画可视化，依赖 `@repo/ui-shadcn`。

### 2.1 动画管理器 (`src/logic/StackAnimator.ts`)

负责计算 GSAP 时间线。

```typescript
import { gsap } from 'gsap'

export class StackAnimator {
  private elementHeight = 64
  private gap = 12

  public animatePush(el: HTMLElement, existingElements: HTMLElement[]) {
    const tl = gsap.timeline()
    if (existingElements.length > 0) {
      tl.to(existingElements, {
        y: `+=${this.elementHeight + this.gap}`,
        duration: 0.4,
        ease: 'power3.out',
      })
    }
    tl.fromTo(
      el,
      { opacity: 0, y: -this.elementHeight, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' },
      '-=0.2',
    )
    return tl
  }

  public animatePop(el: HTMLElement, remainingElements: HTMLElement[]) {
    const tl = gsap.timeline()
    tl.to(el, { y: -100, opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' })
    if (remainingElements.length > 0) {
      tl.to(
        remainingElements,
        {
          y: `-=${this.elementHeight + this.gap}`,
          duration: 0.4,
          ease: 'power2.inOut',
        },
        '-=0.1',
      )
    }
    return tl
  }
}
```

### 2.2 动画栈组件 (`src/components/AnimatedStack.vue`)

从 `@repo/ui-shadcn` 导入组件进行组合。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { StackElement } from '@repo/shared-types'
import { Card, CardContent, Badge } from '@repo/ui-shadcn'
import { StackAnimator } from '../logic/StackAnimator'

const props = defineProps<{ items: StackElement[] }>()
const stackContainer = ref<HTMLElement | null>(null)
const animator = new StackAnimator()

// ... 动画钩子逻辑 (onEnter, onLeave) ...
</script>

<template>
  <div class="p-8 bg-slate-50 border-2 border-dashed rounded-3xl">
    <div ref="stackContainer" class="flex flex-col items-center gap-3">
      <TransitionGroup :css="false" @enter="onEnter" @leave="onLeave">
        <div v-for="item in items" :key="item.id">
          <Card class="w-64 h-16 shadow-md">
            <CardContent class="p-4 flex justify-between items-center h-full">
              <span class="font-mono font-bold">{{ item.value }}</span>
              <Badge>{{ item.type }}</Badge>
            </CardContent>
          </Card>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
```

---

## 3. 依赖配置预览

### `packages/ui-shadcn/package.json`

```json
{
  "name": "@repo/ui-shadcn",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./globals.css": "./src/assets/globals.css"
  }
}
```

### `packages/ui-animation/package.json`

```json
{
  "name": "@repo/ui-animation",
  "dependencies": {
    "gsap": "^3.12.5",
    "vue": "^3.5.13",
    "@repo/ui-shadcn": "workspace:*",
    "@repo/shared-types": "workspace:*"
  }
}
```

---

## 4. 实施顺序

1. **基础设施**: 创建 `packages/ui-shadcn` 并初始化 `components.json`。
2. **组件同步**: 使用 CLI 添加 `Card` 和 `Badge`，并创建 `src/index.ts`。
3. **动画开发**: 创建 `packages/ui-animation` 并实现 `StackAnimator`。
4. **项目集成**: 在 `apps/web` 中引用这两个包，并更新 `tailwind.config.js` 的内容扫描路径。
