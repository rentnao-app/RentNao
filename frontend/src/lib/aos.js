/** Shared AOS data attributes for soft homepage scroll animations. */
export function aosFadeUp(delay = 0, duration = 650) {
  return {
    'data-aos': 'fade-up',
    'data-aos-delay': delay,
    'data-aos-duration': duration,
  };
}

export function aosFadeIn(delay = 0, duration = 650) {
  return {
    'data-aos': 'fade-in',
    'data-aos-delay': delay,
    'data-aos-duration': duration,
  };
}

export function aosFadeRight(delay = 0, duration = 700) {
  return {
    'data-aos': 'fade-right',
    'data-aos-delay': delay,
    'data-aos-duration': duration,
  };
}

export function aosFadeLeft(delay = 0, duration = 700) {
  return {
    'data-aos': 'fade-left',
    'data-aos-delay': delay,
    'data-aos-duration': duration,
  };
}

/** Stagger delay for grid/list items (caps at 360ms). */
export function aosStagger(index, step = 60) {
  return Math.min(index * step, 360);
}
