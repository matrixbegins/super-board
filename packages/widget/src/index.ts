export { KanWidget } from './widget';
export type {
  KanWidgetConfig,
  PageMetadata,
  Annotation,
  CommentPin,
  WidgetEvent,
  FeedbackCategory,
} from './types';

// Attach to window for script-tag usage
import { KanWidget } from './widget';
if (typeof window !== 'undefined') {
  (window as any).KanWidget = KanWidget;
}
