const ElementType = {
  SOFTGOAL: 'Softgoal',
  GOAL: 'Goal',
  TASK: 'Task',
  RESOURCE: 'Resource',
  ARGUMENT: 'Argument',
  UNKNOWN: 'Unknown',
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
  INTRO_SOURCE: 'Intro Source',
  INTRO_DEST: 'Intro Dest',
  DISABLE: 'Disable',
}

class CriticalQuestion {
  constructor(name, question, answer, applicableTo, effect) {
    this.name = name;
    this.question = question;
    this.applicableTo = applicableTo;
    this.effect = effect;
    this.answer = answer;
    this.explanation = '';
  }
}

class CriticalQuestionsDatabase {
  constructor() {
    this.questionByName = {};
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
    this.questionByName[question.name] = question;
    for (const type of question.applicableTo) {
      if (isElement(type)) {
        this.iEelementToQuestionMap[type].push(question);
      }
      if (isLink(type)) {
        this.iElinkToQuestionMap[type].push(question);
      }
    }
  }
  getQuestionsForType(type) {
    return this.iEelementToQuestionMap[type];
  }
  getQuestionByName(name) {
    return this.questionByName[name];
  }
}

const questionsDatabase = new CriticalQuestionsDatabase();
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ1", "Is the resource available?", "No",
          [ElementType.RESOURCE], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ2a", "Is the task possible?", "No",
          [ElementType.TASK], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ3", "Can the goal be realized?", "No",
          [ElementType.GOAL], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ4", "Is the softgoal legitimate?", "No",
          [ElementType.SOFTGOAL], CriticalQuestionEffect.DISABLE));

class IEElement {
  constructor(id, type, name) {
    this.id = id;
    this.names = [name];
    this.type = type;
    this.acceptStatus = ElementAcceptStatus.ACCEPTED;
    this.notes = '';
  }
  getName() { 
    const name = this.names.slice(-1)[0];
    if (!name) console.error("No name for element with id ", this.id);
    return name;
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
    this.notes = '';
  }
}

class Argument {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.acceptStatus = ElementAcceptStatus.ACCEPTED;
    this.explanation = '';
  }
  getName() { return this.name; }
}

class AttackLink {
  constructor(id, fromId, toId) {
    this.id = id;
    this.fromId = fromId;
    this.toId = toId;
    this.type = LinkType.ATTACK;
  }
}

class RationalGRLModel {
  constructor() {
    this.elementIdMap = {};
    this.linkIdMap = {};
    // Map containing elementId -> [dependencyLink] elements.
    this.dependencyMap = {};
    // Map containing elementId -> [contributionLink] elements.
    this.contributionMap = {};
    // Map containing elementId -> [decompositionLink] elements.
    // Note that all decomposition links for a single element should
    // be of the same type.
    this.decompositionMap = {};
    // Map containg elementId -> [attacLink] elements.
    this.attackMap = {};
    // Map from any element's id to its graph element.
    this.graphElementMap = {};
    this.allLinksMaps = [this.dependencyMap, this.contributionMap, this.decompositionMap,
                          this.attackMap];
    // Map containing elementId -> [CriticalQuestion], which are
    // all the critical questions that have been answered for the element.
    this.elementIdToAnsweredQuestionsMap = {};
    // Map from arguments to the name of a critical question. This will be populated
    // if the argument was created as the result of answering a critical question.
    this.argumentIdToCriticalQuestionMap = {};
  }

  addElement(graphElement, name) {
    const type = getType(graphElement);
    const id = graphElement.id;
    if (!isElement(type)) {
      console.error("Type not valid element: ", type);
      return;
    }
    this.elementIdMap[id] = 
        isArgument(type) ?
          new Argument(id, name)
        : new IEElement(id, type, name);
    this.graphElementMap[id] = graphElement;
    Paper.findViewByModel(graphElement).setLabel(name);
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
    }
    delete this.graphElementMap[id];
  }

  // Remove link and empties decompostion text if the link is a decomposition
  // and not further decompositions exist to the same element.
  removeLink(id) {
    for (const map of this.allLinksMaps) {
      for (const key of Object.keys(map)) {
        // Loop backwards so we can remove from array while iterating.
        let i = map[key].length;
        while (i--) {
          const link = map[key][i];
          if (link.id == id) {
            map[key].splice(i,1);
          } 
        }
        // If all elements are removed, remove the entry from the map.
        if (!map[key].length) delete map[key];
      }
    }
    delete this.linkIdMap[id];
    delete this.graphElementMap[id];
  }

  addLink(id, insertType, fromId, toId, graphLink) {
    const type = insertTypeToLinkType(insertType);
    if (type == LinkType.UNKNOWN) {
      console.error("Invalid InsertOperation when adding link: ", insertType);
      return;
    }
    let link = (type == LinkType.ATTACK) ?
        new AttackLink(id, fromId, toId)
      : new IELink(id, type, fromId, toId);
      this.linkIdMap[id] = link;
    if (this.decompositionMap[link.fromId] && this.decompositionMap[link.fromId].length) {
      link.decompositionType = this.decompositionMap[link.fromId][0].decompositionType;
    }
    this.insertLinkToMaps(link, type, graphLink);
  }

  insertLinkToMaps(link, type, graphLink) {
    const fromId = link.fromId;
    let map = null;
    this.graphElementMap[link.id] = graphLink;
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
          this.getView(fromId).setDecomposition('and');
        }
        break;
      case LinkType.DEPENDENCY:
        map = this.dependencyMap;
        break;
    }
    if (map[fromId]) map[fromId].push(link);
    else map[fromId] = [link];
    this.linkIdMap[link.id] = link;
  }

  getDecompositionLabel(id) {
    const map = this.decompositionMap;
    return map[id] && map[id].length ? map[id][0].decompositionType : '';
  }

  rename(id, newName) {
    const element = this.elementIdMap[id];
    if (element.hasOwnProperty('names')) element.names.push(newName);
    else element.name = newName;
    const graphElement = this.graphElementMap[id];
    Paper.findViewByModel(graphElement).setLabel(newName);
  }

  answerQuestion(id, question) {
    const map = this.elementIdToAnsweredQuestionsMap;
    if (!map[id] || !map[id].length) map[id] = [question];
    else map[id].push(question);
  }

  getView(id) {
    return Paper.findViewByModel(this.graphElementMap[id]);
  }

  elementHasAnswer(id, name) {
    return (this.elementIdToAnsweredQuestionsMap[id] || [])
        .map(question => question.name)
        .indexOf(name) != -1;
  }

  getAnswer(id, name) {
    for (const answer of this.elementIdToAnsweredQuestionsMap[id] || []) {
      if (answer.name == name) return answer;
    }
    console.error("Element with id ", id, " does not have answer ", name);
    return null;
  }

  linkArgumentToQuestion(id, name) {
    this.argumentIdToCriticalQuestionMap[id] = name;
  }

  getType(id) {
    return getType(this.graphElementMap[id]);
  }

  getCriticalQuestionForArgument(id) {
    return this.argumentIdToCriticalQuestionMap[id];
  }

  getElement(id) {
    return this.elementIdMap[id];
  }

  getLink(id) {
    return this.linkIdMap[id];
  }

  changeDecompositionTypeOf(id, decompositionType) {
    for (const key of Object.keys(this.decompositionMap)) {
      const links = this.decompositionMap[key];
      if (!links.some(link => link.id == id)) continue;
      for (const link of links) {
        link.decompositionType = DecompositionType[decompositionType];
      }
      this.getView(key).setDecomposition(decompositionType.toLowerCase());
    }
  }
}

const rationalGrlModel = new RationalGRLModel();