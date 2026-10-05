export type ItemType = 
  | 'note'
  | 'link'
  | 'todo'
  | 'board'
  | 'column'
  | 'table'
  | 'image'
  | 'comment'
  | 'line'
  | 'timer'
  | 'title'
  | 'file'
  | 'calendar'
  | 'markdown'
  | 'folder';

export type ItemColor = 
  | 'default' // White / Neutral
  | 'peach'   // Warm peach / orange
  | 'purple'  // Lavender / purple
  | 'mint'    // Soft green / mint
  | 'blue'    // Sky blue
  | 'yellow'  // Soft canary yellow
  | 'dark'    // Slate / dark charcoal
  | 'rose'    // Rose pink
  | 'amber'   // Amber gold
  | 'indigo'  // Deep indigo
  | 'emerald'; // Vibrant emerald

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  notes?: string;
  createdAt?: number;
}

export interface TableRow {
  id: string;
  cells: Record<string, string | boolean | number>;
}

export interface TableColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'currency';
  width?: number;
}

export interface TableData {
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
}

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  id: string;
  points: DrawPoint[];
  color: string;
  size: number;
}

export type WorkflowStatus = 'none' | 'done' | 'in_progress' | 'pending' | 'error';

export interface BaseItem {
  id: string;
  boardId: string;
  type: ItemType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: ItemColor;
  customColor?: string; // Hex color code for full customization (e.g. #f43f5e)
  customTextColor?: string;
  label?: string;
  workflowStatus?: WorkflowStatus;
  workflowNote?: string;
  reactions?: string[];
  columnId?: string; // If nested inside a Column/Stack
  orderInColumn?: number;
  createdAt: number;
  updatedAt: number;
}

export interface NoteItem extends BaseItem {
  type: 'note';
  title: string;
  content: string;
  isDocument?: boolean;
  isExpanded?: boolean;
  pinned?: boolean;
  tags?: string[];
  fontFamily?: 'sans' | 'serif' | 'mono';
  paperStyle?: 'plain' | 'ruled' | 'grid' | 'warm-paper';
}

export interface LinkItem extends BaseItem {
  type: 'link';
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  imageUrl?: string;
  siteName?: string;
  mediaType?: 'video' | 'article' | 'website' | 'music';
  videoId?: string;
  isLoading?: boolean;
  fetchError?: string;
}

export interface TodoCardItem extends BaseItem {
  type: 'todo';
  title: string;
  todos: TodoItem[];
  description?: string;
  filter?: 'all' | 'active' | 'completed';
  hideCompleted?: boolean;
}

export interface BoardItem extends BaseItem {
  type: 'board';
  title: string;
  targetBoardId?: string; // Links directly to the unique BoardData in workspace.boards
  description?: string;
  iconName?: string;
  customIcon?: string;
  cardCount?: number;
  boardCount?: number;
  docCount?: number;
}

export interface ColumnItem extends BaseItem {
  type: 'column';
  title: string;
  collapsed?: boolean;
}

export interface TableCardItem extends BaseItem {
  type: 'table';
  table: TableData;
}

export interface ImageCardItem extends BaseItem {
  type: 'image';
  url: string;
  caption?: string;
  alt?: string;
}

export interface CommentItem extends BaseItem {
  type: 'comment';
  author: string;
  avatar?: string;
  text: string;
  resolved?: boolean;
  isExpanded?: boolean;
}

export interface LineConnectorItem extends BaseItem {
  type: 'line';
  fromId: string;
  toId: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  arrowStart?: boolean;
  arrowEnd?: boolean;
  colorHex?: string;
  isCollapsed?: boolean;
}

export type TimerDisplayMode = 'visual_disk' | 'countdown' | 'stopwatch';
export type DiskColorTheme = 'teal' | 'coral' | 'indigo' | 'amber' | 'lavender';
export type TimerPreset = 'pomodoro_25' | 'short_break_5' | 'long_break_15' | 'deep_work_50' | 'custom';

export interface TimerCardItem extends BaseItem {
  type: 'timer';
  title: string;
  mode: 'countdown' | 'stopwatch' | 'visual_disk';
  displayMode?: TimerDisplayMode;
  diskColor?: DiskColorTheme;
  showDigitalNumbers?: boolean;
  totalDurationSeconds: number; // For countdown or visual disk, e.g. 1500 (25 min)
  remainingSeconds: number; // For countdown or visual disk
  elapsedSeconds: number; // For stopwatch or elapsed tracking
  isRunning: boolean;
  isCompleted?: boolean;
  lastStartedAt?: number;
  category?: string;
  simpleMode?: boolean; // When true or default: renders the minimal "Basic Time" circular clock
  clockPurpose?: 'focus' | 'task' | 'stopwatch'; // 'focus' (breaks when time is up), 'task' (overtime + Done button with time saved), or 'stopwatch' (count up)
  overtimeSeconds?: number; // Overtime count for task clocks
  isTaskDone?: boolean; // When user marks task completed
  preset?: TimerPreset;
  alarmTime?: string; // Scheduled time of day alarm, e.g. "15:30"
  alarmLabel?: string;
  alarmFired?: boolean;
  linkedTaskId?: string; // Links this clock to a specific task
  taskStats?: {
    totalDurationSeconds: number;
    timeTakenSeconds: number;
    timeSavedSeconds: number; // positive if completed before deadline, negative if overtime
  };
}

export interface TimeLogEntry {
  id: string;
  boardId: string;
  boardTitle: string;
  cardId?: string;
  cardTitle: string;
  durationSeconds: number;
  startedAt: number;
  endedAt: number;
  category: 'Design' | 'Development' | 'Planning' | 'Review' | 'Storyboard' | 'Meeting' | 'Writing' | 'Other';
  notes?: string;
}

export interface TitleCardItem extends BaseItem {
  type: 'title';
  text: string;
  level: 1 | 2 | 3; // Heading 1, 2, or 3
  align?: 'left' | 'center' | 'right';
}

export type FileCategory =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'archive'
  | 'video'
  | 'audio'
  | 'code'
  | 'image'
  | 'generic';

export interface FileCardItem extends BaseItem {
  type: 'file';
  fileName: string;
  fileSize: number; // bytes
  fileMime: string;
  fileExtension: string;
  fileCategory: FileCategory;
  fileDataUrl?: string; // Data URL for small files or offline fallback
  blobKey?: string; // IndexedDB key for unlimited binary storage
  driveFileId?: string; // Google Drive synced file ID
  driveWebViewLink?: string; // Direct link to open in Google Drive / Google Docs / Office
  driveSyncStatus?: 'local' | 'uploading' | 'synced' | 'error';
  notes?: string;
  thumbnailUrl?: string;
}

export type CalendarEventCategory = 'Deadline' | 'Milestone' | 'Meeting' | 'Task' | 'Review' | 'Personal';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "10:00"
  endTime?: string; // e.g. "11:30"
  color?: ItemColor | string;
  completed?: boolean;
  notes?: string;
  category?: CalendarEventCategory;
  linkedCardId?: string; // Reference to a related canvas card
  reminderMinutesBefore?: number; // 0 for at event time, 15 for 15m before, 60 for 1h before
  alarmFired?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export type CalendarViewMode = 'month' | 'week' | 'agenda' | 'mini';

export interface CalendarCardItem extends BaseItem {
  type: 'calendar';
  title: string;
  viewMode: CalendarViewMode;
  currentDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  showConnectedDeadlines?: boolean; // Pull in dueDates/deadlines from connected cards
  includeAllBoardTasks?: boolean; // Pull in tasks with due dates across this board
  isCompact?: boolean;
}

export interface FolderCardItem extends BaseItem {
  type: 'folder';
  title: string;
  description?: string;
  files: FileCardItem[];
  iconName?: string;
  viewMode?: 'grid' | 'list';
  sortBy?: 'name' | 'date' | 'size' | 'type';
  sortDirection?: 'asc' | 'desc';
}

export type CanvasItem = 
  | NoteItem
  | LinkItem
  | TodoCardItem
  | BoardItem
  | ColumnItem
  | TableCardItem
  | ImageCardItem
  | CommentItem
  | LineConnectorItem
  | TimerCardItem
  | TitleCardItem
  | FileCardItem
  | CalendarCardItem
  | FolderCardItem;

export interface BoardData {
  id: string;
  parentId: string | null;
  title: string;
  description?: string;
  icon?: string;
  color?: ItemColor;
  customColor?: string;
  viewState: {
    panX: number;
    panY: number;
    zoom: number;
  };
  strokes?: DrawStroke[];
}

export interface TrashedItemEntry {
  id: string;
  item: CanvasItem;
  deletedAt: number;
  originalBoardId: string;
  originalBoardTitle?: string;
}

export interface TrashedBoardEntry {
  id: string;
  board: BoardData;
  boardCardItem?: BoardItem;
  deletedAt: number;
  childItems: CanvasItem[];
  originalParentId: string | null;
}

export interface WorkspaceTrash {
  items: Record<string, TrashedItemEntry>;
  boards: Record<string, TrashedBoardEntry>;
}

export type CanvasBackgroundStyle = 'dots' | 'grid' | 'cross' | 'blank';
export type CanvasTheme = 'light' | 'dark';

export interface CanvasSettings {
  backgroundStyle: CanvasBackgroundStyle;
  theme: CanvasTheme;
  snapToGrid?: boolean;
  gridSize?: number; // 16, 24, or 32
  canvasColor?: string;
  dotSize?: number; // Dot radius in px: e.g. 0.4 to 2.5 (default: 0.9)
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  dismissedNotificationIds?: string[];
  readNotificationIds?: string[];
}

export type NotificationType =
  | 'timer_running'
  | 'timer_completed'
  | 'alarm_fired'
  | 'deadline_overdue'
  | 'deadline_today'
  | 'event_today'
  | 'event_upcoming';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  boardId?: string;
  boardTitle?: string;
  cardId?: string;
  cardTitle?: string;
  itemId?: string;
  itemType?: ItemType;
  dueDate?: string;
  time?: string;
  timerRemainingSeconds?: number;
  timerTotalSeconds?: number;
  timerIsRunning?: boolean;
  daysOverdue?: number;
  isOverdue?: boolean;
}

export interface WorkspaceTab {
  id: string;
  title?: string; // e.g. "Room 1", "Room 2", or custom user name
  boardId: string; // The board currently displayed in this tab
}

export interface WorkspaceData {
  version: number;
  currentBoardId: string;
  boards: Record<string, BoardData>;
  items: Record<string, CanvasItem>;
  settings?: CanvasSettings;
  timeLogs?: TimeLogEntry[];
  trash?: WorkspaceTrash;
  tabs?: WorkspaceTab[];
  activeTabId?: string;
  updatedAt: number;
}

export interface GoogleDriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export interface DriveSyncStatus {
  isSignedIn: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  driveFileId: string | null;
  folderId: string | null;
  error: string | null;
  autoSync: boolean;
}
