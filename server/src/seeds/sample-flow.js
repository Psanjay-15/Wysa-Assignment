const sampleFlow = {
  flowId: "wellbeing-flow",
  name: "Fictional Wellbeing Conversation",
  version: 1,
  modules: [
    {
      moduleId: "daily-check-in",
      title: "Daily Check-in",
      startQuestionId: "daily-feeling",
      questions: [
        {
          questionId: "daily-feeling",
          text: "How are you feeling today?",
          options: [
            {
              optionId: "daily-calm",
              text: "Calm",
              next: {
                type: "question",
                moduleId: "daily-check-in",
                questionId: "daily-support",
              },
            },
            {
              optionId: "daily-stressed",
              text: "Stressed",
              next: {
                type: "question",
                moduleId: "stress-support",
                questionId: "stress-level",
              },
            },
            {
              optionId: "daily-tired",
              text: "Tired",
              next: {
                type: "question",
                moduleId: "sleep-support",
                questionId: "sleep-problem",
              },
            },
          ],
        },
        {
          questionId: "daily-support",
          text: "Would you like to try a breathing exercise?",
          options: [
            {
              optionId: "daily-breathe",
              text: "Yes",
              next: {
                type: "question",
                moduleId: "breathing-exercise",
                questionId: "breathing-ready",
              },
            },
            {
              optionId: "daily-finish",
              text: "No, finish for now",
              next: { type: "complete" },
            },
          ],
        },
      ],
    },
    {
      moduleId: "stress-support",
      title: "Stress Support",
      startQuestionId: "stress-level",
      questions: [
        {
          questionId: "stress-level",
          text: "How strong does your stress feel?",
          options: [
            {
              optionId: "stress-mild",
              text: "Mild",
              next: {
                type: "question",
                moduleId: "stress-support",
                questionId: "stress-help",
              },
            },
            {
              optionId: "stress-high",
              text: "High",
              next: {
                type: "question",
                moduleId: "breathing-exercise",
                questionId: "breathing-ready",
              },
            },
          ],
        },
        {
          questionId: "stress-help",
          text: "What kind of support would help right now?",
          options: [
            {
              optionId: "stress-sleep-help",
              text: "Sleep support",
              next: {
                type: "question",
                moduleId: "sleep-support",
                questionId: "sleep-problem",
              },
            },
            {
              optionId: "stress-continue",
              text: "Continue stress support",
              next: {
                type: "question",
                moduleId: "stress-support",
                questionId: "stress-checkpoint",
              },
            },
            {
              optionId: "stress-finish",
              text: "Finish for now",
              next: { type: "complete" },
            },
          ],
        },
        {
          questionId: "stress-checkpoint",
          text: "Would you like to begin a fresh stress check-in?",
          isCheckpoint: true,
          options: [
            {
              optionId: "stress-restart",
              text: "Start again",
              next: {
                type: "question",
                moduleId: "stress-support",
                questionId: "stress-level",
              },
            },
            {
              optionId: "stress-checkpoint-finish",
              text: "Finish",
              next: { type: "complete" },
            },
          ],
        },
      ],
    },
    {
      moduleId: "sleep-support",
      title: "Sleep Support",
      startQuestionId: "sleep-problem",
      questions: [
        {
          questionId: "sleep-problem",
          text: "What is making sleep difficult?",
          options: [
            {
              optionId: "sleep-falling",
              text: "Falling asleep",
              next: {
                type: "question",
                moduleId: "sleep-support",
                questionId: "sleep-routine",
              },
            },
            {
              optionId: "sleep-staying",
              text: "Staying asleep",
              next: {
                type: "question",
                moduleId: "sleep-support",
                questionId: "sleep-routine",
              },
            },
          ],
        },
        {
          questionId: "sleep-routine",
          text: "Would a calming breathing exercise help?",
          options: [
            {
              optionId: "sleep-breathe",
              text: "Yes",
              next: {
                type: "question",
                moduleId: "breathing-exercise",
                questionId: "breathing-ready",
              },
            },
            {
              optionId: "sleep-finish",
              text: "No, finish for now",
              next: { type: "complete" },
            },
          ],
        },
      ],
    },
    {
      moduleId: "breathing-exercise",
      title: "Breathing Exercise",
      startQuestionId: "breathing-ready",
      questions: [
        {
          questionId: "breathing-ready",
          text: "Are you ready to try a short breathing exercise?",
          options: [
            {
              optionId: "breathing-start",
              text: "Start",
              next: {
                type: "question",
                moduleId: "breathing-exercise",
                questionId: "breathing-result",
              },
            },
            {
              optionId: "breathing-not-now",
              text: "Not now",
              next: { type: "complete" },
            },
          ],
        },
        {
          questionId: "breathing-result",
          text: "How do you feel after the exercise?",
          options: [
            {
              optionId: "breathing-calmer",
              text: "Calmer",
              next: { type: "complete" },
            },
            {
              optionId: "breathing-still-stressed",
              text: "Still stressed",
              next: {
                type: "question",
                moduleId: "stress-support",
                questionId: "stress-checkpoint",
              },
            },
          ],
        },
      ],
    },
  ],
};

export default sampleFlow;
