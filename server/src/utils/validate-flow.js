const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const validateId = (id, label, errors) => {
  if (!id || !idPattern.test(id)) {
    errors.push(`${label} must be a lowercase, hyphen-separated ID`);
  }
};

const validateFlow = (flow) => {
  const errors = [];
  const moduleIds = new Set();
  const questionIds = new Set();
  const optionIds = new Set();

  validateId(flow.flowId, "Flow ID", errors);

  if (!Array.isArray(flow.modules) || flow.modules.length === 0) {
    errors.push("A flow must contain at least one module");
    return errors;
  }

  for (const module of flow.modules) {
    validateId(module.moduleId, "Module ID", errors);

    if (moduleIds.has(module.moduleId)) {
      errors.push(`Duplicate module ID: ${module.moduleId}`);
    }
    moduleIds.add(module.moduleId);

    if (!Array.isArray(module.questions) || module.questions.length === 0) {
      errors.push(`Module ${module.moduleId} must contain at least one question`);
      continue;
    }

    for (const question of module.questions) {
      validateId(question.questionId, "Question ID", errors);

      if (questionIds.has(question.questionId)) {
        errors.push(`Duplicate question ID: ${question.questionId}`);
      }
      questionIds.add(question.questionId);

      if (!Array.isArray(question.options) || question.options.length === 0) {
        errors.push(`Question ${question.questionId} must contain at least one option`);
        continue;
      }

      for (const option of question.options) {
        validateId(option.optionId, "Option ID", errors);

        if (optionIds.has(option.optionId)) {
          errors.push(`Duplicate option ID: ${option.optionId}`);
        }
        optionIds.add(option.optionId);
      }
    }

    const startQuestionExists = module.questions.some(
      (question) => question.questionId === module.startQuestionId,
    );

    if (!startQuestionExists) {
      errors.push(
        `Starting question ${module.startQuestionId} does not exist in module ${module.moduleId}`,
      );
    }
  }

  for (const module of flow.modules) {
    for (const question of module.questions || []) {
      for (const option of question.options || []) {
        if (!option.next) {
          errors.push(`Option ${option.optionId} does not have a next destination`);
          continue;
        }

        if (option.next.type === "complete") {
          continue;
        }

        if (option.next.type !== "question") {
          errors.push(`Option ${option.optionId} has an invalid next type`);
          continue;
        }

        const targetModule = flow.modules.find(
          (item) => item.moduleId === option.next.moduleId,
        );

        if (!targetModule) {
          errors.push(
            `Option ${option.optionId} points to missing module ${option.next.moduleId}`,
          );
          continue;
        }

        const targetQuestionExists = (targetModule.questions || []).some(
          (item) => item.questionId === option.next.questionId,
        );

        if (!targetQuestionExists) {
          errors.push(
            `Option ${option.optionId} points to missing question ${option.next.questionId}`,
          );
        }
      }
    }
  }

  return errors;
};

export default validateFlow;
