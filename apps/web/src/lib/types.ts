export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type DocumentType = "canvas" | "text";

export type Profile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
};

export type DocumentSummary = {
  id: string;
  workspaceId: string;
  type: DocumentType;
  title: string;
  summary: string | null;
  updatedAt: string;
};

export type DocumentRoomInfo = {
  document: DocumentSummary;
  workspaceId: string;
  role: WorkspaceRole;
  canEdit: boolean;
};

export type Point = {
  x: number;
  y: number;
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

type BaseShape = {
  id: string;
  kind: "rectangle" | "circle" | "arrow" | "freehand" | "text" | "sticky";
  x: number;
  y: number;
  stroke: string;
  fill?: string;
  strokeWidth: number;
  opacity?: number;
  createdBy?: string;
  updatedAt: number;
};

export type RectangleShape = BaseShape & {
  kind: "rectangle";
  width: number;
  height: number;
};

export type CircleShape = BaseShape & {
  kind: "circle";
  radius: number;
};

export type ArrowShape = BaseShape & {
  kind: "arrow";
  end: Point;
};

export type FreehandShape = BaseShape & {
  kind: "freehand";
  points: Point[];
};

export type TextShape = BaseShape & {
  kind: "text";
  text: string;
  width: number;
};

export type StickyShape = BaseShape & {
  kind: "sticky";
  text: string;
  width: number;
  height: number;
};

export type CanvasShape =
  | RectangleShape
  | CircleShape
  | ArrowShape
  | FreehandShape
  | TextShape
  | StickyShape;

export type CanvasTool = "select" | "pan" | "rectangle" | "circle" | "arrow" | "freehand" | "text" | "sticky" | "eraser";

export type CanvasStyle = {
  stroke: string;
  fill: string;
  strokeWidth: number;
  opacity: number;
};

export type EditorBlock = {
  id: string;
  type: "paragraph" | "heading" | "todo";
  content: string;
  order: number;
  updatedAt: number;
};

export type AwarenessUser = {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
};

export type AwarenessCursor = {
  x: number;
  y: number;
  documentId: string;
};
