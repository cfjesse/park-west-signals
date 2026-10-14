# Angular: Signals-First Rules

Applies to all Angular code in this workspace (Angular 22, standalone, zoneless-friendly).

## Core principle
Use signals for all state and reactivity. **Avoid RxJS Observables and `.subscribe()`**.
Only touch RxJS if a third-party API forces it, and convert at the boundary
(`toSignal()`), never subscribing manually.

## Required patterns

| Need | Use |
| --- | --- |
| Local/component state | `signal()` |
| Derived values | `computed()` |
| State that resets/derives from another signal but is also writable | `linkedSignal()` |
| Side effects (logging, storage, DOM sync) | `effect()` — never to derive state |
| HTTP reads | `httpResource()` (from `@angular/common/http`) |
| Non-HTTP async reads | `resource()` |
| Debounced input / search | `debounced()` (from `@angular/core`) |
| Forms | Signal Forms (`form()`, `FormField`, validators, `debounce()` from `@angular/forms/signals`) |
| Component I/O | `input()`, `output()`, `model()` |
| Queries | `viewChild()`, `contentChild()` etc. |
| Shared state | Injectable services holding signals; expose `asReadonly()` |

## Guidelines
- Do not use `Observable`, `Subject`, `BehaviorSubject`, `HttpClient` + `subscribe`,
  `async` pipe, `valueChanges`, `ngModel`, or Reactive/Template-driven Forms.
- Do not use `@Input()`/`@Output()` decorators, `@ViewChild`, or `ngOnChanges`.
- Use `httpResource` params as a reactive function; read `.value()`, `.isLoading()`,
  `.error()`, `.hasValue()`; trigger refetch with `.reload()`.
- For mutations (POST/PUT/DELETE), prefer `HttpClient` wrapped in a promise-returning
  method (`firstValueFrom`) invoked from event handlers — no manual subscriptions.
- Use `linkedSignal` for selection/pagination state that must reset when its source changes
  (e.g. reset page to 1 when the filter changes).
- Debounce at the source: `debounced(() => query(), 300)` feeding an `httpResource`,
  or `debounce(path, ms)` inside a Signal Form schema.
- Prefer `computed` over `effect`; never write to signals inside `effect` unless unavoidable.
- Use `ChangeDetectionStrategy.OnPush`, native control flow (`@if`, `@for`, `@switch`),
  and `inject()` instead of constructor injection.
- Keep signal values immutable (use `update()` with new objects/arrays).

## Example sketch
```ts
@Component({ /* ... */ })
export class Search {
  protected readonly query = signal('');
  private readonly debouncedQuery = debounced(this.query, 300);

  protected readonly results = httpResource<Item[]>(() => {
    const q = this.debouncedQuery.value();
    return q ? `/api/items?q=${encodeURIComponent(q)}` : undefined;
  });

  protected readonly page = linkedSignal({ source: this.query, computation: () => 1 });
  protected readonly count = computed(() => this.results.value()?.length ?? 0);
}
```
