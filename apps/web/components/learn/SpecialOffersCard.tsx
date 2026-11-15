'use client';

export default function SpecialOffersCard() {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-[16px] text-neutral-600">
        Special <span className="font-bold text-neutral-800">Offers</span>
      </h2>

      {/* Promo card — subtle primary tint, not heavy gradient */}
      <div className="relative overflow-hidden rounded-[12px] bg-primary-50 p-5">
        <div className="relative z-10">
          <p className="text-[16px] font-bold text-neutral-800">50 Days of Premium!</p>
          <p className="mt-1 text-[11px] text-neutral-500">Get it Before 01.01.2027</p>
          <button
            type="button"
            className="mt-4 h-[36px] rounded-[8px] bg-success px-4 text-[13px] font-medium text-white transition-opacity duration-100 hover:opacity-90"
          >
            Learn More
          </button>
        </div>

        {/* Brand decoration */}
        <div className="absolute -bottom-2 -right-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-[24px] font-bold text-primary-500 opacity-60">
          d
        </div>
      </div>
    </div>
  );
}
