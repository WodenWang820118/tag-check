export type NestedObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type ParameterMap = {
  type: 'MAP';
  map: Parameter[];
};

export type ParameterListItem =
  | ParameterMap
  | {
      type: string;
      value?: string;
      map?: Parameter[];
    };

export type Parameter = {
  type: string;
  // Some parameter objects (e.g. TRIGGER_REFERENCE list items) don't carry a key
  key?: string;
  value?: string;
  list?: ParameterListItem[];
};

export type ParameterWithKeyValue = Parameter & {
  key: string;
  value: string;
};

export type CustomEventFilter = {
  type: string;
  parameter: Parameter[];
};

export type DataRow = {
  [key: string]: string;
};

export type DataLayer = {
  event: string;
  paths: string[];
};
