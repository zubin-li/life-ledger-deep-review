# Third-party notices

## Memos visual gallery layout

The journal photo collage follows the count-to-grid rules in [Memos](https://github.com/usememos/memos) `web/src/components/MemoMetadata/Attachment/visualGalleryLayout.ts` at commit `0d989707f82c33f74bb852edd8965ec88fcf041b`, distributed under the MIT License. The adapted function is `photoCollageMarkup` in `public/app.js`. Tailwind class names and React components were not copied.

Copyright (c) Memos contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Kairos Pomodoro mini-player gate

The focus mini-player is shown only while a session is active and is hidden while the focus panel is open. That visibility rule is adapted from [Kairos Pomodoro](https://github.com/shakibdshy/Kairos-Pomodoro) `src/components/layout/timer-mini-player.tsx` at commit `fb1f18d2237a4da03ff9189ef44174d05bc15beb`, distributed under the MIT License. The adapted behavior lives in `renderFocusTimer` in `public/app.js`. The Sahara theme, icon set, and timer store were not copied.

Copyright (c) Kairos Pomodoro contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Actual Budget report summary

The Insights range line prints the end date only when it differs from the start, and the summary pairs one window total with one per-day average. That rule is adapted from [Actual Budget](https://github.com/actualbudget/actual) `packages/desktop-client/src/components/reports/ReportSummary.tsx` at commit `8e165c0eb6871f05177e0aa8589894c783ef122e`, distributed under the MIT License. The adapted functions are `reportRangeSentence` and `reportSummaryMarkup` in `public/app.js`. Financial formatting and chart components were not copied.

Copyright (c) Actual Budget contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Lucide Icons

The habit icon picker contains adapted inline SVG paths from [Lucide](https://lucide.dev/), distributed under the ISC License.

Copyright (c) Lucide Contributors.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

## Tencent CloudBase JavaScript SDK

The optional mainland-China synchronization build bundles [Tencent CloudBase JavaScript SDK](https://github.com/TencentCloudBase/cloudbase-js-sdk) version 3.8.0, distributed under the Apache License 2.0.

Copyright Tencent CloudBase contributors. See the upstream repository for the full license and notices.

## heic2any

The optional HEIC/HEIF browser conversion fallback bundles [heic2any](https://github.com/alexcorvi/heic2any) version 0.0.4, distributed under the MIT License. It is loaded only when the browser cannot decode an Apple HEIC/HEIF photo natively.

Copyright (c) 2020 Alex Corvi.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the conditions in the upstream MIT License.
