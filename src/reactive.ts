export const fromEvent = (
  element: EventTarget,
  event: keyof HTMLElementEventMap
) => {
  let listener;
  return new ReadableStream<Event>({
    start(controller) {
      listener = (e: Event) => controller.enqueue(e);
      element.addEventListener(event, listener);
    },
  });
};

type ReadableTrasnformStream =
  | ReadableStream<Event>
  | TransformStream<Event, Event>;

export const mergeEvents = (streams: ReadableTrasnformStream[]) => {
  return new ReadableStream<Event>({
    async start(controller) {
      for (const stream of streams) {
        const reader =
          stream instanceof ReadableStream
            ? stream.getReader()
            : stream.readable.getReader();

        async function read() {
          const { value, done } = await reader.read();
          if (done||!controller.desiredSize) return;
          controller.enqueue(value);

          return read();
        }

        read();
      }
    },
  });
};

export const mapThrough = <T>(fn: Function) => {
  return new TransformStream<any, T>({
    transform(chunk, controller) {
      controller.enqueue(fn.bind(fn)(chunk));
    },
  });
};

type StreamFunction = (chunk: any) => ReadableStream | TransformStream;

export type SwitchMapOptions = {
  pairWise: boolean;
};

export const switchMap = (
  fn: StreamFunction,
  options: SwitchMapOptions = { pairWise: true }
) => {
  return new TransformStream({
    transform(chunk, controller) {
      const stream = fn.bind(fn)(chunk);
      const reader =
        stream instanceof ReadableStream
          ? stream.getReader()
          : stream.readable.getReader();

      async function read() {
        const { value, done } = await reader.read();
        if (done) return;
        controller.enqueue(options.pairWise ? [chunk, value] : value);
        return read();
      }
      return read();
    },
  });
};

export const takeUntil = (stream: ReadableStream | TransformStream) => {
  const readkill = async (
    stream: ReadableStream | TransformStream,
    controller: TransformStreamDefaultController
  ) => {
    const reader =
      stream instanceof ReadableStream
        ? stream.getReader()
        : stream.readable.getReader();
    const { value } = await reader.read();
    controller.enqueue(value);
    controller.terminate();
  };

  return new TransformStream({
    start(controller) {
      readkill(stream, controller);
    },
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
};
