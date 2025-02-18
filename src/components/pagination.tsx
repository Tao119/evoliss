import Image from "next/image";
import { useState, useEffect } from "react";
import ArrowLeft from "@/assets/image/arrow_left.svg";
import ArrowRight from "@/assets/image/arrow_right.svg";

interface Props {
  className?: string;
  page?: number;
  total?: number;
  all: number;
  updatePage: (_: number) => void;
}

export const Pagination = (props: Props) => {
  const [current, setPage] = useState(props.page || 1);
  const [[prev, next], setStatus] = useState<string[]>(["", ""]);
  const [items, setItems] = useState<(string | number)[]>([]);
  const total = props.total || 20;
  const all = props.all;
  const max = Math.ceil(all / total);

  useEffect(() => {
    setPage(props.page!);

    setStatus([
      current <= 1 ? "-inactive" : "",
      current >= max ? "-inactive" : "",
    ]);

    const paginationItems = [];
    const startNum = Math.max(1, current - 2);
    const endNum = Math.min(startNum + 5, max);
    for (let i = startNum; i <= endNum; i++) {
      paginationItems.push(i);
    }
    if (paginationItems.length < 6) {
      for (let i = startNum - 1; i > 0; i--) {
        paginationItems.unshift(i);
        if (paginationItems.length === 6) break;
      }
    }
    setItems(paginationItems);
  }, [props, all, current, max, total]);

  const updatePage = (page: number) => {
    if (page > 0 && page <= max) {
      setPage(page);
      props.updatePage(page);
    }
  };

  return (
    <>
      <div className={`c-pagination ${props.className || ""}`}>
        <div className="c-pagination__nav">
          <ul className="c-pagination__nav-item">
            <li
              className={"c-pagination__nav-link " + prev}
              onClick={() => updatePage(current - 1)}
            >
              <Image src={ArrowLeft} alt="" />
            </li>
            {items.map((page, index) => (
              <li
                key={index}
                className={`c-pagination__nav-link ${
                  page === current
                    ? "-active"
                    : page === "..."
                    ? "-disabled"
                    : ""
                }
                ${Math.abs(index - current + 1) >= 2 ? "-far" : ""}`}
                onClick={() => updatePage(page as number)}
              >
                <div className="c-pagination__nav-text">{page}</div>
              </li>
            ))}
            <li
              className={"c-pagination__nav-link " + next}
              onClick={() => updatePage(current + 1)}
            >
              <Image src={ArrowRight} alt="" />
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
