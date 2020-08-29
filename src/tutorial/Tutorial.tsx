import {
  faArrowLeft,
  faArrowRight,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MDXProvider } from "@mdx-js/react";
import React, { useState } from "react";
import { ClickablePre } from "./ClickablePre";
import Functions1 from "./Functions1.mdx";
import Functions2 from "./Functions2.mdx";
import Functions3 from "./Functions3.mdx";
import Lisp1 from "./Lisp1.mdx";
import Lisp2 from "./Lisp2.mdx";
import Lisp3 from "./Lisp3.mdx";
import Lisp4 from "./Lisp4.mdx";
import Lisp5 from "./Lisp5.mdx";
import ProofsFail1 from "./ProofsFail1.mdx";
import ProofsFail2 from "./ProofsFail2.mdx";
import ProofsFail3 from "./ProofsFail3.mdx";
import ProofsFail4 from "./ProofsFail4.mdx";
import Theorems1 from "./Theorems1.mdx";
import Theorems2 from "./Theorems2.mdx";
import Theorems3 from "./Theorems3.mdx";
import Theorems4 from "./Theorems4.mdx";
import Theorems5 from "./Theorems5.mdx";
import Theorems6 from "./Theorems6.mdx";

const PAGES = [
  <Lisp1 />,
  <Lisp2 />,
  <Lisp3 />,
  <Lisp4 />,
  <Lisp5 />,
  <Functions1 />,
  <Functions2 />,
  <Functions3 />,
  <Theorems1 />,
  <Theorems2 />,
  <Theorems3 />,
  <Theorems4 />,
  <Theorems5 />,
  <Theorems6 />,
  <ProofsFail1 />,
  <ProofsFail2 />,
  <ProofsFail3 />,
  <ProofsFail4 />,
];

export function Tutorial({ onEdit }: { onEdit: () => void }) {
  const [pageNum, setPageNum] = useState(0);

  return (
    <div id="tutorial">
      <div id="toolbar">
        <button
          onClick={() => {
            setPageNum((n) => n - 1);
          }}
          disabled={pageNum == 0}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button
          onClick={() => {
            setPageNum((n) => n + 1);
          }}
          disabled={pageNum == PAGES.length - 1}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
        <button
          onClick={() => {
            onEdit();
          }}
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      </div>
      <div className="content">
        <MDXProvider components={{ pre: ClickablePre }}>
          {PAGES[pageNum]}
        </MDXProvider>
      </div>
    </div>
  );
}
