import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/cn";

export interface FloatingImage {
  src: string;
  alt: string;
  className: string;
}

function Swirls() {
  return (
    <>
      <svg
        className="absolute left-0 top-0 -translate-x-1/3 -translate-y-1/3 text-brand-orange/25"
        width="600"
        height="600"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M515.266 181.33C377.943 51.564 128.537 136.256 50.8123 293.565C-26.9127 450.874 125.728 600 125.728 600"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 text-brand-yellow/40"
        width="700"
        height="700"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M26.8838 528.274C193.934 689.816 480.051 637.218 594.397 451.983C708.742 266.748 543.953 2.22235 543.953 2.22235"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

export function FloatingFoodHero({
  title,
  description,
  images = [],
  photo,
  className,
}: {
  title: string;
  description?: string;
  images?: FloatingImage[];
  photo?: StaticImageData;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex min-h-[28rem] w-full items-center justify-center overflow-hidden py-10 md:min-h-[36rem] md:py-16",
        className
      )}
    >
      <div className="absolute inset-0 z-0">
        <Swirls />
      </div>
      <div className="absolute inset-0 z-10">
        {images.map((image, index) => (
          <img
            key={image.src + index}
            src={image.src}
            alt={image.alt}
            className={cn("absolute object-contain", image.className)}
            style={{ animationDelay: `${index * 300}ms` }}
          />
        ))}
      </div>
      <div className="relative z-20 mx-auto w-full max-w-3xl px-4 text-center">
        {photo && (
          <div className="relative mx-auto mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]">
            <Image src={photo} alt="" fill priority sizes="(min-width: 768px) 48rem, 100vw" className="object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description ? <p className="mt-6 text-lg leading-8 text-neutral-700">{description}</p> : null}
      </div>
    </section>
  );
}
