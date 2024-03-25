export function build(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ratio = window.devicePixelRatio || 1;
  const client = canvas.getBoundingClientRect();

  canvas.width = client.width * ratio;
  canvas.height = client.height * ratio;

  ctx.scale(ratio, ratio);
  canvas.style.width = `${client.width}px`;
  canvas.style.height = `${client.height}px`;
}

export const touchToMouseEventsMap = new Map([
  ["touchstart", "mousedown"],
  ["touchmove", "mousemove"],
  ["touchend", "mouseup"],
]);

export function toMouseEvent(e: TouchEvent) {
  e.preventDefault();

  const [touch] =
    e.touches.length > 0 ? Array.from(e.touches) : Array.from(e.changedTouches);

  return new MouseEvent(touchToMouseEventsMap.get(e.type)!, {
    clientX: touch.clientX,
    clientY: touch.clientY,
  });
}

export function preventEvent(e: Event) {
  e.preventDefault();
  return e;
}

export function getMousePosition(e: Event) {
  const canvas: HTMLCanvasElement = document.querySelector("canvas")!;
  const client = canvas.getBoundingClientRect();
  return {
    x: (e as MouseEvent).clientX - client.left,
    y: (e as MouseEvent).clientY - client.top,
  };
}

export function generateCoordinates(
  this: { previous: Event | null },
  [previousEvent, currentEvent]: MouseEvent[]
) {
  this.previous = this.previous ?? previousEvent;

  const [from, to] = [this.previous, currentEvent].map((e) =>
    getMousePosition(e)
  );

  this.previous = ["mouseup", "mouseleave"].includes(currentEvent.type)
    ? null
    : currentEvent;

  return { from, to };
}

export function getCurrentTool() {
  return document.querySelector<HTMLInputElement>(
    "input[type='radio'][name='tool']:checked"
  )!.value;
}

export function getCurrentColor() {
  return document.querySelector<HTMLInputElement>(
    "input[type='radio'][name='color']:checked"
  )!.value;
}

export interface Coordinates {
  to: { x: number; y: number };
  from: { x: number; y: number };
}

export function draw({ from, to }: Coordinates) {
  const cxt = document.querySelector<HTMLCanvasElement>("canvas")!.getContext("2d")!
  const tool = getCurrentTool();
  const color = getCurrentColor();

  cxt.lineJoin = "round"
  cxt.lineCap = "round"
  switch (tool) {
    case "pencil":
      cxt.lineWidth = 2
      cxt.strokeStyle = color
      cxt.globalCompositeOperation = "source-over"
      break;
    case "eraser":
      cxt.lineWidth = 22
      cxt.strokeStyle = "#111111"
      cxt.globalCompositeOperation = "destination-out"
      break;
  }
  cxt.beginPath()
  cxt.moveTo(from.x, from.y)
  cxt.lineTo(to.x, to.y)
  cxt.stroke()
}

export function clear() {
  const canvas = document.querySelector<HTMLCanvasElement>("canvas")!
  const ctx = canvas.getContext("2d")!
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function download() {
  const canvas = document.querySelector<HTMLCanvasElement>("canvas")!
  const ctx = canvas.getContext("2d")!

  const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer)
  if(buffer.some(e => 0 !== e)) {
    const a = document.createElement("a")
    a.setAttribute("download", `justdraw-${crypto.randomUUID()}.png`)
    canvas.toBlob(function(e) {
      const blob = URL.createObjectURL(e ?? new Blob());
      a.setAttribute("href", blob)
      a.click()
    })
  }
}