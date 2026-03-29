import { useEffect, useState } from "react";
import styles from "./BooksList.module.css";

const API_URL = "https://api.piratereads.com/140474195/read";
const PER_PAGE = 30;

interface Book {
  book_title: string;
  book_cover_small?: string;
  book_cover_medium?: string;
  book_author: string;
  book_link?: string;
  avg_rating?: number;

  rating?: number;
  review_text?: string;
  review_published_on: string;
}

interface BooksResponse {
  count?: number;
  books?: Book[];
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span
      className={styles.bookRating}
      aria-label={`${clamped} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <img
          key={i}
          src="/star.svg"
          alt="star rating"
          width={16}
          height={16}
          style={{ opacity: i < clamped ? 1 : 0.3, marginBottom: "0" }}
        />
      ))}
    </span>
  );
}

const LATIN_QUOTES = "\u2018\u2019\u201C\u201D\u0027\u0022";

function fixQuoteFonts(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);

  for (const textNode of nodes) {
    const text = textNode.textContent ?? "";
    if (![...LATIN_QUOTES].some((c) => text.includes(c))) continue;

    const fragment = document.createDocumentFragment();
    let run = "";
    for (const ch of text) {
      if (LATIN_QUOTES.includes(ch)) {
        if (run) {
          fragment.appendChild(document.createTextNode(run));
          run = "";
        }
        const span = document.createElement("span");
        span.style.fontFamily = "Georgia, 'Times New Roman', serif";
        span.textContent = ch;
        fragment.appendChild(span);
      } else {
        run += ch;
      }
    }
    if (run) fragment.appendChild(document.createTextNode(run));
    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

export default function BooksList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = `${API_URL}?per_page=${PER_PAGE}&page=${currentPage}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load reviews: ${res.status}`);
        return res.json();
      })
      .then((data: BooksResponse) => {
        setReviews(data.books ?? []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load reviews.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage]);

  useEffect(() => {
    document
      .querySelectorAll(`.${styles.bookReview}, .${styles.bookInfo}`)
      .forEach(fixQuoteFonts);
  }, [reviews]);

  const showBack = currentPage > 1;
  const showNext = reviews.length >= PER_PAGE;

  return (
    <>
      {loading && <div className={styles.booksLoading}>grabbing reviews…</div>}
      {error && (
        <div className={styles.booksError} role="alert">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className={styles.booksListContainer}>
          <div className={styles.bookArrowContainer}>
            {showBack && (
              <img
                src="https://assets.mariannefeng.com/books/left-arrow.svg"
                className={styles.bookArrow}
                onClick={() => setCurrentPage((p) => p - 1)}
              />
            )}
          </div>

          <ul className={styles.booksList} hidden={reviews.length === 0}>
            {reviews.map((r, i) => {
              const rating =
                r.rating != null
                  ? Math.min(5, Math.max(0, Math.round(r.rating)))
                  : 0;

              const avgRating =
                r.avg_rating != null
                  ? Math.min(5, Math.max(0, Math.round(r.avg_rating)))
                  : 0;

              const dateStr = formatDate(r.review_published_on);

              return (
                <li key={`${r.book_title}-${i}`}>
                  <div className={styles.bookRow}>
                    <a href={r.book_link} target="_blank">
                      <img
                        src={r.book_cover_medium}
                        alt={r.book_title ?? ""}
                        width={60}
                      />
                    </a>

                    <div className={styles.bookInfo}>
                      <a href={r.book_link} target="_blank">
                        <span className={styles.bookTitle}>{r.book_title}</span>
                      </a>
                      <span className={styles.bookAuthor}>{r.book_author}</span>
                    </div>
                  </div>
                  <div>
                    <div className={styles.bookReviewFooter}>
                      <div className={styles.bookReviewRating}>
                        <span>goodreads: </span>
                        <div className={styles.bookingReviewAvgRating}>
                          <StarRating rating={avgRating} />
                          <span>({r.avg_rating})</span>
                        </div>
                      </div>
                      <div className={styles.bookReviewRating}>
                        <span>me: </span>
                        <StarRating rating={rating} />
                      </div>
                    </div>
                    {r.review_text?.trim() && (
                      <div
                        className={styles.bookReview}
                        dangerouslySetInnerHTML={{ __html: r.review_text }}
                      />
                    )}
                    <span className={styles.bookReviewDate}>{dateStr}</span>
                  </div>

                  {i < reviews.length - 1 && (
                    <img
                      src="https://assets.mariannefeng.com/books/divider.svg"
                      className={styles.bookHr}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <div className={styles.bookArrowContainer}>
            {showNext && (
              <img
                src="https://assets.mariannefeng.com/books/right-arrow.svg"
                className={styles.bookArrow}
                onClick={() => setCurrentPage((p) => p + 1)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
