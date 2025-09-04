### React 性能优化要点（本项目准则）

> 本文档用于记录并沉淀本项目中的 React/Next.js 性能优化最佳实践与检查清单。后续若新增优化点，请在本文件持续补充，保持与代码实现一致。

## 渲染控制与组件拆分

- **合理拆分组件**：将大组件拆为多个关注点单一的子组件，缩小重渲染范围。
- **React.memo**：对纯展示或 props 稳定的子组件使用 `React.memo`，减少父级状态变化带来的重渲染。
- **useCallback/useMemo**：
  - **useCallback** 保证回调引用稳定，避免因函数新建导致子组件重渲染。
  - **useMemo** 缓存昂贵计算的结果，避免重复计算。
- **useRef 存储非渲染状态**：对无需参与渲染的数据，使用 `useRef` 而非 `useState`，避免无谓渲染。
- **稳定 key**：列表渲染确保使用稳定、唯一的 `key`（如后端 id 或本地生成的 uuid），不要使用数组索引。
- **避免派生状态重复保存**：可计算出的数据用 `useMemo` 推导，避免在 state 中重复保存导致同步问题。
- **依赖数组正确**：`useEffect/useCallback/useMemo` 严格填写依赖，防止不必要执行或漏执行。

## 图片与上传相关优化

- **预览 URL 管理**：
  - 使用 `URL.createObjectURL(file)` 为选择的文件生成 `blob:` 预览 URL。
  - 删除对应图片时只 `URL.revokeObjectURL` 该项的 URL；不要批量重建所有预览，避免卡顿与多余网络请求。
- **next/image 预览**：
  - 预览 `blob:` URL 时使用 `next/image` 的自定义 `loader` 与 `unoptimized`（示例见下文），避免无意义优化请求与 Lint 警告。
- **增量上传**：编辑态中仅上传新增文件；已有线上 URL 直接复用，减少带宽与时间。
- **并发与节流**：多图上传可限制并发（如 3-5），并对重试/错误提示做友好处理。

## 列表与虚拟化

- **虚拟滚动**：对于长列表使用 `react-window/react-virtualized` 等虚拟化技术，减少 DOM 节点与渲染开销。
- **分页与增量加载**：按需分页或无限滚动，避免一次性加载全部数据。
- **Skeleton/占位**：提升感知性能，降低首次渲染抖动。

## 表单性能

- **React Hook Form（推荐）**：优先使用 RHF 控制渲染粒度，避免所有字段频繁重渲染。
- **防抖/节流**：对输入频繁的字段（搜索、富文本）使用防抖，减少网络与状态更新频率。
- **避免匿名函数/内联对象**：在 JSX 中避免直接声明对象或函数，配合 `useCallback`/`useMemo` 传递稳定引用。

## Next.js 特有优化

- **RSC 边界最小化**：尽量将纯数据处理放在 Server Components，Client Components 仅承担交互与视图。
- **动态导入**：对体积大或非首屏组件使用 `dynamic()` 懒加载，支持 `ssr: false` 降低首屏体积。
- **next/image**：合理设置尺寸、`priority` 与 `loading="lazy"`（非预览场景），减少布局抖动与带宽浪费。
- **缓存策略**：API 路由/页面结合 `cache-control` 与 Next `revalidate` 合理缓存，避免重复请求。
- **避免 Edge 运行时不兼容 API**：如 `jsonwebtoken` 某些 Node API 不适配 Edge，注意运行时选择与依赖兼容性。

## 网络与资源

- **请求取消**：输入联动类查询使用 `AbortController` 中止无效请求。
- **数据缓存**：SWR/React Query 对热点数据做缓存与失效策略管理，减少重复请求。
- **并发控制**：上传、批量请求采用并发上限，避免阻塞主线程与网络拥塞。

## 监控与排查

- **React Profiler**：定位重渲染组件与渲染耗时热点。
- **Lighthouse/Next 分析**：关注 LCP、CLS、JS 体积与关键路径资源。
- **日志与埋点**：关键操作与慢接口加日志，定位卡顿源头（网络/渲染/脚本）。

## 检查清单（落地执行）

- [ ] 子组件是否 `React.memo`，父组件回调是否 `useCallback`
- [ ] 列表项 `key` 是否稳定唯一
- [ ] 预览 `blob:` URL 是否按项生成与销毁，无全量重建
- [ ] 编辑态是否仅上传新增文件，旧图直连 URL
- [ ] 大组件是否拆分，状态是否内聚到最小必要范围
- [ ] 输入是否防抖/节流；表单是否用 RHF 控制渲染
- [ ] 是否使用动态导入与合适的图片优化策略
- [ ] 请求是否具备缓存、取消、并发控制

## 常见陷阱

- 每次渲染都 `createObjectURL`，导致大量 `blob:` 请求与卡顿。
- 子组件 `key` 变化或父组件传入新对象/函数，触发无意义重渲染。
- 在 state 冗余保存可推导数据，导致同步困难与多次渲染。

## 代码示例

- **稳定图片预览（按项生成与销毁 URL）**

```ts
// 结构：仅对新增文件生成 blob URL，删除时只 revoke 对应项
interface SelectedImageItem {
  id: string;
  file?: File | null;
  url: string;
}

const blobLoader: import('next/image').ImageLoader = ({ src }) => src;

const ImageTile = React.memo(function ImageTile({
  src,
  alt,
  onRemove,
}: {
  src: string;
  alt: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        loader={blobLoader}
        unoptimized
        width={200}
        height={80}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1"
      >
        ×
      </button>
    </div>
  );
});
```

- **回调与子组件 memo**

```ts
const removeImage = useCallback((id: string) => {
  setSelectedImages((prev) => prev.filter((p) => p.id !== id));
}, []);

const Grid = React.memo(function Grid({
  items,
  onRemove,
}: {
  items: SelectedImageItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="grid">
      {items.map((it) => (
        <ImageTile
          key={it.id}
          src={it.url}
          alt="预览"
          onRemove={() => onRemove(it.id)}
        />
      ))}
    </div>
  );
});
```

- **表单防抖**

```ts
const onSearch = useMemo(() => debounce((q: string) => fetchList(q), 300), []);
useEffect(() => () => onSearch.cancel(), [onSearch]);
```

## 维护约定

- 文档位置：`docs/react-optimizations.md`
- 更新原则：当引入/修改影响性能的代码路径时，同步在本文件记录要点与原因；变更单中引用本节的检查清单项。
- 后续新增优化点（例如虚拟化接入、并发上传、SWR 缓存等），请追加到对应章节并附示例。
