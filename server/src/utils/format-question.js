const formatQuestion = (question) => ({
  questionId: question.questionId,
  text: question.text,
  isCheckpoint: question.isCheckpoint,
  options: question.options.map((option) => ({
    optionId: option.optionId,
    text: option.text,
  })),
});

export default formatQuestion;
