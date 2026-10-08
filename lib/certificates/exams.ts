// Static copy that isn't in the API: the 7 module names/descriptions, and the programme labels.
// Edit these to match your real copy — nothing here is pulled from the API.
export const PROGRAM = {
  certificateLabel: "Certificate",
  // Used only if the API sends no cert_title.
  fallbackTitle: "Frontend Engineering",
  // Dates are optional in the API. With at least two valid dates we state the length; otherwise we leave it out.
  durationLine: (dates: (string | null | undefined)[]) => {
    const t = dates
      .map((d) => (d ? new Date(d).getTime() : NaN))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const base = "has successfully completed the";
    if (t.length < 2) return `${base} TenThousand Engineering Internship`;
    const months = Math.max(1, Math.round((t[t.length - 1] - t[0]) / (1000 * 60 * 60 * 24 * 30.44)));
    return `${base} ${months}-month TenThousand Engineering Internship`;
  },
  ceoName: "Viktor Chukhlov",
  ceoTitle: "CEO, TenThousand",
  signature: "V. Chukhlov",
};

// Each entry is tied to the exam name the API sends: `key` is matched against `name` ("Lecture 1" -> "lecture1").
// Edit `title` / `description` here; to add a lecture, add an entry with its key.
const LECTURE_LIST = [
  {
    key: "lecture1",
    name: "Algorithmic Problem-Solving with Constrained JavaScript",
    description:
      "Students solved complex logical problems using a deliberately limited set of JavaScript features, which pushed them toward creative, out-of-the-box thinking rather than relying on built-in shortcuts. This approach helped sharpen core programming logic and problem-solving instincts. Key topics included character codes (charCodes), the event loop in depth (call stack, task queue, microtask queue), and how promises are scheduled and resolved during execution.",
  },
  {
    key: "lecture2",
    name: "Data Structures & Memory Management Under the Hood",
    description:
    "Students explored how JavaScript manages memory through garbage collection, along with the internal behavior of Objects, Arrays, WeakMaps, and WeakSets. This gave them a deeper understanding of the language beyond surface-level syntax. Practical tasks included implementing a deep clone algorithm without recursion, dynamically grouping data by type, and working with built-in method quirks such as automatic numeric index sorting in objects.",
  },
  {
    key: "lecture3",
    name: "Sorting & Load Balancing Algorithms",
    description:
      "Students explored a broad range of sorting algorithms — including Bubble, Selection, Insertion, Merge, Quick, Heap, Shell, Bucket, Counting, Radix, and Tim Sort — along with binary search, to understand their mechanics, efficiency trade-offs, and appropriate use cases. Building on this, students studied numerous load balancing strategies (such as Least Connection, Weighted Round Robin, IP/URL Hashing, Consistent Hashing, and Global Server Load Balancing, among others) used in distributed systems. Applying this knowledge, students designed their own algorithmic solutions to simulated real-world problems involving data distribution and traffic balancing."
  },
  {
    key: "lecture4",
    name: "Regular Expressions",
    description:
      "Students undertook an in-depth study of regular expressions, followed by extensive hands-on practice writing them independently — without reference material — to reliably parse phone numbers in all formats, IP addresses, MAC addresses, HTML tags, usernames, emails, links, query parameters, and specific text patterns. The module's exam combined logical problem-solving with heavily constrained regex tasks to test both algorithmic thinking and regex mastery. Each solution was rigorously questioned during evaluation to confirm students had a complete, precise understanding of every part of the pattern they wrote, rather than surface-level familiarity."
  },
  {
    key: "lecture5",
    name: "Browser Events, Communication APIs & Networking",
    description:
      "Students studied bitwise operations and binary logic in depth, learning to optimize code performance, compact data, and solve complex problems using low-level binary techniques, alongside the full spectrum of browser event mechanisms including EventEmitter, native and custom events, event listeners, and MouseEvent. This extended into cross-context communication techniques such as postMessage (for parent-iframe and cross-window messaging), localStorage synchronization across tabs, the Broadcast Channel API, and IndexedDB. Students also covered various request methods — XMLHttpRequest, Fetch, Axios (with middleware), AbortController, WebSockets, WebRTC, SOAP, and HTTP/HTTPS — along with debounce and throttle techniques for performance optimization. Practical assignments included building an event-driven modal system, parent-iframe and cross-tab communication tools, a real-time localStorage sync mechanism, a debounced YouTube search page with request cancellation via AbortController, and a full real-time chat application with WebSocket-based rooms, online status, and typing indicators. Separately, students also studied the Nested Set model for representing and querying hierarchical data structures efficiently. This exam, along with the two that follow, was conducted as a technical interview centered on these topics, assessing both practical implementation and depth of understanding."
  },
  {
    key: "lecture6",
    name: "React In-Depth & TypeScript",
    description:
      "Students conducted a deep dive into React, covering all major hooks (useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef with forwardRef/useImperativeHandle, and others), with particular focus on the hooks used in 95% of real-world scenarios. This extended to class component lifecycle methods and their call order, the Context API with render-count analysis, memoization, lazy loading/Suspense, startTransition, fragments, and advanced APIs such as createPortal, cloneElement, and isValidElement. Students also explored conceptual foundations including the Virtual DOM vs. Shadow DOM, pure functions, and Pure Components, then applied this by rebuilding an audio player using D3.js for waveform visualization, working directly with audio streaming, audio channeling, and buffers, alongside drag-and-drop file loading and an interactive draggable playback cursor synced to real-time audio position. In parallel, students studied TypeScript in depth — including generics, enums, mapped and conditional types, type narrowing, decorators, function overloading, and strict configuration via tsconfig.json — with React and TypeScript serving as the two main focal points of this module. This exam, part of the technical-interview-style assessment series, evaluated both practical implementation skill and theoretical depth across both technologies."
  },
  {
    key: "lecture7",
    name: "React Native Development",
    description:
      "Students learned to build cross-platform mobile applications with React Native, gaining practical command of core native device features — camera, microphone, background tasks, geolocation, and permission management — alongside custom fonts, SVG integration, gradients, and animations with react-native-reanimated. This extended to navigation and deep linking, WebView integration, environment configuration, secure storage, and biometric authentication. Students also worked with state management (MobX, Redux, Redux Saga/Thunk), Apollo cache and optimistic responses, and complex UI solutions built on virtualized lists, among other techniques. Core layout principles — such as proper SafeAreaView and scrollable container usage — were emphasized throughout to ensure consistent behavior across iOS and Android. As a final assessment, students built a personal project incorporating most of these tools and concepts, which was evaluated on code quality, functionality, and UI style during the exam."
  },
] as const;

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "");

export const LECTURES: Record<string, { title: string; description: string }> = Object.fromEntries(
  LECTURE_LIST.map((l) => [l.key, { title: l.name, description: l.description }]),
);

// Look up a lecture by the name the API sends (case/spacing-insensitive). Unknown names fall back to themselves.
export function lectureFor(apiName: string): { title: string; description: string } {
  const hit = LECTURES[norm(apiName)] ?? Object.values(LECTURES).find((l) => norm(l.title) === norm(apiName));
  return hit ?? { title: apiName, description: "" };
}
