export default function QuestionContent({ question, className = "question-text", as = "h2" }) {
  const Heading = as;
  if (!question.richContent?.length) {
    return <Heading className={className}>{question.question}</Heading>;
  }

  return (
    <div className={`question-rich-content ${className}`}>
      {question.richContent.map((block, index) => {
        if (block.type === "table") {
          return (
            <div className="question-table-wrap" key={`table-${index}`}>
              <table className="question-table">
                {block.rows[0] && (
                  <thead>
                    <tr>{block.rows[0].map((cell, cellIndex) => <th key={cellIndex}><CellContent cell={cell} /></th>)}</tr>
                  </thead>
                )}
                <tbody>
                  {block.rows.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => <td key={cellIndex}><CellContent cell={cell} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p className="question-rich-paragraph" key={`paragraph-${index}`}>
            {block.text}
            <Images images={block.images} />
          </p>
        );
      })}
    </div>
  );
}

export function OptionContent({ option }) {
  return (
    <span className="option-text">
      <Images images={option.images} />
      {option.text && <span>{option.text}</span>}
    </span>
  );
}

function CellContent({ cell }) {
  return <>{cell.text}<Images images={cell.images} /></>;
}

function Images({ images = [] }) {
  if (!images.length) return null;
  return images.map((src, index) => (
    <img className="question-image" src={src} alt="Question illustration" key={`${index}-${src.slice(0, 40)}`} />
  ));
}
