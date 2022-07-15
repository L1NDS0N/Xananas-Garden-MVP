import React, { useState } from 'react';
import Image from 'next/image';
import { CaretLeft, CaretRight, Package } from 'phosphor-react';

interface ProductImagePagerProps {
  images?: { image: string }[];
  alt: string;
  sizes: string;
  className?: string;
}

/**
 * Product card image with a lightweight prev/next pager + dots, so a shopper can
 * flip through a product's other photos right from the catalog grid/list without
 * opening the product page. Lives inside a `<Link>` card, so every control here
 * stops propagation to avoid triggering the card's navigation.
 */
const ProductImagePager: React.FC<ProductImagePagerProps> = ({ images, alt, sizes, className = '' }) => {
  const [index, setIndex] = useState(0);
  const hasImages = !!images && images.length > 0;
  const hasMultiple = hasImages && images!.length > 1;

  const goTo = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    e.preventDefault();
    setIndex(i);
  };
  const prev = (e: React.MouseEvent) => goTo(e, (index - 1 + images!.length) % images!.length);
  const next = (e: React.MouseEvent) => goTo(e, (index + 1) % images!.length);

  if (!hasImages) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <Package size={40} className="text-gray-300" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full group/pager ${className}`}>
      <Image
        src={images![index].image}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
      />

      {hasMultiple && (
        <>
          <button onClick={prev} title="Imagem anterior"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover/pager:opacity-100 transition-opacity">
            <CaretLeft size={13} />
          </button>
          <button onClick={next} title="Próxima imagem"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover/pager:opacity-100 transition-opacity">
            <CaretRight size={13} />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex gap-1">
            {images!.map((_, i) => (
              <button key={i} onClick={(e) => goTo(e, i)} title={`Imagem ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-3 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductImagePager;
