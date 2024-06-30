// icon:robot | Bootstrap https://icons.getbootstrap.com/ | Bootstrap
'use client'
import * as React from "react";

function IconRobot(props: React.SVGProps<SVGSVGElement>) {

  return (
    <svg
      fill="currentColor"
      viewBox="0 0 16 16"
      height="1em"
      width="1em"
      {...props}
    >
      <path className="robotAnimation" d="M6 12.5 a.5.5 0 0 1.5 -.5 h 3 a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 004.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 01-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 013 9.219" />

      <path className="oscillate" stroke="#1e293b" fill="none" stroke-width="0.4" strokeMiterlimit="10" d="M 4 8.5 L 6.4 8.5 L 7.6 7 L 8.5 9.6 L 9.6 8.4 L 12 8.4" />

      <path  className="robotAnimation" d="M8.5 1.866a1 1 0 10-1 0V3h-2A4.5 4.5 0 001 7.5V8a1 1 0 00-1 1v2a1 1 0 001 1v1a2 2 0 002 2h10a2 2 0 002-2v-1a1 1 0 001-1V9a1 1 0 00-1-1v-.5A4.5 4.5 0 0010.5 3h-2V1.866zM14 7.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V7.5A3.5 3.5 0 015.5 4h5A3.5 3.5 0 0114 7.5z" />
    </svg>

  );
}

export default IconRobot;
