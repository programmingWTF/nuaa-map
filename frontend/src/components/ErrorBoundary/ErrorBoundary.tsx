import { Component, type ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  /** 降级 UI 中显示的区域名称 */
  name?: string;
  /** 自定义降级 UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(
      `[ErrorBoundary${this.props.name ? ` · ${this.props.name}` : ''}]`,
      error.message,
      '\nComponent stack:', info.componentStack,
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="eb-fallback">
          <div className="eb-fallback-card">
            <div className="eb-fallback-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 className="eb-fallback-title">
              {this.props.name ? `${this.props.name} 加载失败` : '组件加载失败'}
            </h3>
            <p className="eb-fallback-desc">
              {this.state.error?.message || '发生了未知错误，请尝试刷新页面'}
            </p>
            <div className="eb-fallback-actions">
              <button className="eb-fallback-btn eb-fallback-btn--retry" onClick={this.handleReset}>
                重试
              </button>
              <button className="eb-fallback-btn eb-fallback-btn--reload" onClick={this.handleReload}>
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
