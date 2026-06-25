import { useRef } from 'react';

export function PhoneFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const baseUrl = window.location.origin + window.location.pathname;
  const iframeParams = new URLSearchParams(window.location.search);
  iframeParams.set('mode', 'phone-preview');
  const iframeSrc = `${baseUrl}?${iframeParams.toString()}`;

  return (
    <div className="flex justify-center items-start min-h-full py-8">
      <div className="relative inline-flex flex-col items-center">
        <div className="relative rounded-[40px] border-[3px] border-gray-700 overflow-hidden shadow-2xl bg-gray-900">
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            width={390}
            height={844}
            className="border-0 block"
            title="手机预览"
          />
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-gray-700 rounded-b-xl z-10" />
        </div>
      </div>
    </div>
  );
}
