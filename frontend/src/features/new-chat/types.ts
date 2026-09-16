/** Кто может войти в группу */
export type GroupAccess = "public" | "invite";

export interface GroupFormValues {
  title: string;
  access: GroupAccess;
  /** Заполняется только для публичных групп */
  username: string;
}

export interface ChannelFormValues {
  title: string;
  username: string;
  description: string;
}
