import "./style.css";
import {
  Coordinates,
  build,
  clear,
  download,
  draw,
  generateCoordinates,
  getCurrentColor,
  preventEvent,
  toMouseEvent,
} from "./canvas";
import {
  Undo2,
  Eraser,
  Circle,
  PencilLine,
  createIcons,
  X,
  HardDriveDownload,
} from "lucide";
import {
  fromEvent,
  mapThrough,
  mergeEvents,
  switchMap,
  takeUntil,
} from "./reactive";

// Initialize icons
createIcons({
  icons: { PencilLine, Circle, Eraser, HardDriveDownload, Undo2, X },
});

// Initialize Storage
const store: { color: string; paths: Coordinates[] }[] = [];

// Initialize canvas
const canvas: HTMLCanvasElement = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
build(canvas, ctx);

mergeEvents([
  fromEvent(canvas, "mousedown"),
  fromEvent(canvas, "touchstart").pipeThrough(mapThrough(toMouseEvent)),
])
  .pipeThrough(
    mapThrough((chunk: any) => {
      store.unshift({ color: getCurrentColor(), paths: [] });
      return chunk;
    })
  )
  .pipeThrough(mapThrough(preventEvent))
  .pipeThrough(
    switchMap(() => {
      return mergeEvents([
        fromEvent(canvas, "mousemove"),
        fromEvent(canvas, "touchmove").pipeThrough(mapThrough(toMouseEvent)),
      ]).pipeThrough(
        takeUntil(
          mergeEvents([
            fromEvent(canvas, "mouseup"),
            fromEvent(canvas, "mouseleave"),
            fromEvent(canvas, "touchend").pipeThrough(mapThrough(toMouseEvent)),
          ])
        )
      );
    })
  )
  .pipeThrough(mapThrough<Coordinates>(generateCoordinates))
  .pipeThrough(
    mapThrough<Coordinates>((chunk: any) => {
      store[0].paths.push(chunk);
      return chunk;
    })
  )
  .pipeTo(new WritableStream({ write: draw }));

mergeEvents([
  fromEvent(document.getElementById("pencil-select")!, "click"),
  fromEvent(document.getElementById("eraser-select")!, "click"),
]).pipeTo(
  new WritableStream({
    write() {
      switch (
        document.querySelector<HTMLInputElement>(
          "input[type='radio'][name='tool']:checked"
        )!.value
      ) {
        case "eraser":
          canvas.style.cursor = "url(/eraser-cursor.png) 10 10, auto";
          break;
        case "pencil":
          canvas.style.cursor = "auto";
          break;
      }
    },
  })
);

fromEvent(document.getElementById("clear")!, "click").pipeTo(
  new WritableStream({
    write: () => {
      clear();
    },
  })
);

fromEvent(document.getElementById("undo")!, "click").pipeTo(
  new WritableStream({
    write() {
      store.shift();
      clear();
      store.forEach((step) => {
        ctx.beginPath();
        ctx.strokeStyle = step.color;
        ctx.moveTo(step.paths[0].from.x, step.paths[0].from.y);
        for (let i = 1; i < step.paths.length; i++) {
          ctx.lineTo(step.paths[i].to.x, step.paths[i].to.y);
        }
        ctx.stroke();
      });
    },
  })
);

fromEvent(document.getElementById("download")!, "click").pipeTo(
  new WritableStream({ write: download })
);
