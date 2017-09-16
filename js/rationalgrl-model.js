const ElementType = {
  SOFTGOAL: 'Softgoal',
  GOAL: 'Goal',
  TASK: 'Task',
  RESOURCE: 'Resource',
  ARGUMENT: 'Argument'
};

const LinkType = {
  CONTRIBUTION: 'Contribution',
  DECOMPOSITION: 'Decomposition',
  DEPENDENCY: 'Dependency',
  ATTACK: 'Attack',
  UNKNOWN: 'Unknown',
};

const DecompositionType = {
  AND: "and",
  OR: "or",
  XOR: "xor",
};

const ContributionValue = {
  BREAK: "Break (---)",
  SOME_NEGATIVE: "Some negative (--)",
  HURT: "Hurt (-)",
  UNKNOWN: "Unknown",
  HELP: "Help (+)",
  SOME_POSITIVE: "Some positive (++)",
  MAKE: "Make (+++)",
};

const ElementAcceptStatus = {
  ACCEPTED: 'Accepted',
  REJECT: 'Rejected',
  UNDECIDED: 'Undecided',
};

const CriticalQuestionEffect = {
  INTRO: 'Intro',
  DISABLE: 'Disable',
  RENAME: 'Rename',
}

class CriticalQuestion {
  constructor(name, question, applicableTo, effect) {
    this.name = name;
    this.question = question;
    this.applicableTo = applicableTo;
    this.effect = effect;
  }
}

class CriticalQuestionsDatabase {
  constructor() {
    this.questions = [];
    this.iEelementToQuestionMap = {};
    this.iEelementToQuestionMap[ElementType.SOFTGOAL] = [];
    this.iEelementToQuestionMap[ElementType.GOAL] = [];
    this.iEelementToQuestionMap[ElementType.TASK] = [];
    this.iEelementToQuestionMap[ElementType.RESOURCE] = [];
    this.iElinkToQuestionMap = {};
    this.iElinkToQuestionMap[LinkType.CONTRIBUTION] = [];
    this.iElinkToQuestionMap[LinkType.DECOMPOSITION] = [];
    this.iElinkToQuestionMap[LinkType.DEPENDENCY] = [];
  }
  addQuestion(question) {
    this.questions.push(question);
    for (const type of question.applicableTo) {
      if (isElement(type)) {
        this.iEelementToQuestionMap[type].push(question);
      }
      if (isLink(type)) {
        this.iElinkToQuestionMap[type].push(question);
      }
    }
  }

}

const questionsDatabase = new CriticalQuestionsDatabase();
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ1", "Is the resource available?", 
          [ElementType.RESOURCE], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ2a", "Is the task possible?", 
          [ElementType.TASK], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ3", "Can the goal be realized?", 
          [ElementType.GOAL], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ4", "Is the softgoal legitimate?", 
          [ElementType.SOFTGOAL], CriticalQuestionEffect.DISABLE));

class IEElement {
  constructor(id, type, name) {
    this.id = id;
    this.names = [name];
    this.type = type;
    this.acceptStatus = ElementAcceptStatus.ACCEPTED;
    this.explanation = "";
  }
}

class IELink {
  constructor(id, type, fromId, toId) {
    this.id = id;
    this.fromId = fromId;
    this.toId = toId;
    this.type = type;
    this.acceptStatus = ElementAcceptStatus.ACCEPTED;
    this.decompositionType = DecompositionType.AND;
    this.contributionValue = ContributionValue.HELP;
  }
}

class Argument {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.acceptStatus = ElementAcceptStatus.ACCEPTED;
  }
}

class AttackLink {
  constructor(id, fromId, toId) {
    this.id = id;
    this.fromId = fromId;
    this.toId = toId;
  }
}

class RationalGRLModel {
  constructor() {
    this.elementIdMap = {};
    this.linkIdMap = {};
    // Map containing elementId -> [dependencyLinkId] elements.
    this.dependencyMap = {};
    // Map containing elementId -> [contributionLinkId] elements.
    this.contributionMap = {};
    // Map containing elementId -> [decompositionLinkId] elements.
    // Note that all decomposition links for a single element should
    // be of the same type.
    this.decompositionMap = {};
    // Map containg elementId -> [attacLinkId] elements.
    this.attackMap = {};
    // Map from any element's id to its graph element.
    this.viewIdMap = {};
    this.allLinksMaps = [this.dependencyMap, this.contributionMap, this.decompositionMap,
                          this.attackMap];
  }

  addElement(id, type, name, view) {
    if (!isElement(type)) {
      console.error("Type not valid element: ", type);
      return;
    }
    this.elementIdMap[id] = 
        isArgument(type) ?
          new Argument(id, name)
        : new IEElement(id, type, name);
    this.viewIdMap[id] = view;
  }

  // Remove the element and all connected links (incoming and outgoing).
  removeElement(id) {
    delete this.elementIdMap[id];
    let linksToRemove = []; // links to remove.
    for (const map of this.allLinksMaps) {
      // Outgoing links: simply remove all links found in the map.
      if (map[id] && map[id].length) {
        linksToRemove = linksToRemove.concat(map[id]);
        delete map[id];
      }
      // Incoming links: reverse search all existing links.
      for (const key of Object.keys(map)) {
        // Loop backwards so we can remove from array while iterating.
        let i = map[key].length;
        while (i--) {
          const link = map[key][i];
          if (link.toId == id) {
            linksToRemove.push(link);
            map[key].splice(i,1);
          } 
        }
        // If all elements are removed, remove the entry from the map.
        if (!map[key].length) delete map[key];

      }
      for (const link of linksToRemove) {
        delete this.linkIdMap[link.id];
      }
      console.log(this);
    }
  }

  addLink(id, insertType, fromId, toId, view) {
    const type = insertTypeToLinkType(insertType);
    if (type == LinkType.UNKNOWN) {
      console.error("Invalid InsertOperation when adding link: ", insertType);
      return;
    }
    let link = (type == LinkType.ATTACK) ?
        new AttackLink(id, fromId, toId)
      : new IELink(id, type, fromId, toId);
      this.linkIdMap[id] = link;
    this.insertLinkToMaps(link, type, view);
  }

  insertLinkToMaps(link, type, view) {
    const fromId = link.fromId;
    let map = null;
    switch(type) {
      case LinkType.ATTACK: 
        map = this.attackMap;
        break;
      case LinkType.CONTRIBUTION:
        map = this.contributionMap;
        break;
      case LinkType.DECOMPOSITION:
        map = this.decompositionMap;
        // Ensure the decomposition type is the same as the existing ones.
        if (map[fromId] && map[fromId].length) {
          link.decompositionType = map[fromId][0].decompositionType;
        } else {
          // initialize the decomposition description of the graph element.
          this.viewIdMap[fromId].setDecomposition('and');
        }
        break;
      case LinkType.DEPENDENCY:
        map = this.dependencyMap;
        break;
    }
    if (map[fromId]) map[fromId].push(link);
    else map[fromId] = [link];
    this.linkIdMap[link.id] = link;
    this.viewIdMap[link.id] = view
    console.log(this);
  }

  getDecompositionLabel(id) {
    const map = this.decompositionMap;
    return map[id] && map[id].length ? map[id][0].decompositionType : '';
  }
}

const rationalGrlModel = new RationalGRLModel();