import searchIcon from "@/assets/image/search.svg";
import { requestDB } from "@/services/axios";
import {
  KeyboardEventHandler,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";

interface Props {
  className?: string;
  name: string;
}

export const SearchBox = ({ name, className }: Props) => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const history = userData?.searchHistories ?? [];
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const onReady = userData;

  useEffect(() => {
    animation.startAnimation();
  }, []);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  const onInputChange = (event: { target: HTMLInputElement }) => {
    setSearchText(event.target.value);
  };

  const removeHistory = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try {
      animation.startAnimation();
      await requestDB("history", "deleteHistoryFromList", { id });
      fetchUserData();
      animation.endAnimation();
    } catch (e) {
      alert("削除に失敗しました");
    }
    animation.endAnimation();
  };

  const handleEnter: KeyboardEventHandler<HTMLInputElement> = async (e) => {
    if (searchText.trim() == "") return;
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      try {
        search();
      } catch (e) {
        alert("検索に失敗しました");
      }
    }
  };

  const search = (query?: string) => {
    router.push(`/courses/result?query=${query ?? searchText}`);
    requestDB("history", "createHistory", {
      userId: userData?.id,
      query: query ?? searchText,
    });
    fetchUserData();
    setSearchText("");
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="c-search-box__outline" ref={containerRef}>
      <div className="c-search-box__box">
        <ImageBox src={searchIcon} className="c-search-box__image" />
        <input
          className={`c-search-box ${className || ""}`}
          type="text"
          placeholder={name}
          onChange={onInputChange}
          value={searchText}
          onKeyDown={handleEnter}
          onFocus={() => setIsFocused(true)}
        />
      </div>

      {isFocused && history.length > 0 && (
        <div className="c-search-box__history-container">
          {history.map((h) => (
            <div
              key={h.id}
              className="c-search-box__history"
              onClick={(e) => {
                e.stopPropagation();
                search(h.query);
              }}
            >
              {h.query}
              <button
                className="c-search-box__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeHistory(h.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
