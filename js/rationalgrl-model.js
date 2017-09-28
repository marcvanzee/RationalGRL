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
  REJECTED: 'Rejected',
  UNDECIDED: 'Undecided',
};

const CriticalQuestionEffect = {
  INTRO_SOURCE: 'Intro Source',
  INTRO_DEST: 'Intro Dest',
  INTRO_LINK: 'Intro Link',
  DISABLE: 'Disable',
};

class CriticalQuestion {
  constructor(name, question, answerApply, answerDontApply, applicableTo, effect) {
    this.name = name;
    this.question = question;
    this.applicableTo = applicableTo;
    this.effect = effect;
    this.answerApply = answerApply;
    this.answerDontApply = answerDontApply;
    this.appliedAnswer = null;
    this.explanation = '';
    this.addedElement = null;
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
    this.iEelementToQuestionMap[ElementType.ARGUMENT] = [];
    this.iElinkToQuestionMap = {};
    this.iElinkToQuestionMap[LinkType.CONTRIBUTION] = [];
    this.iElinkToQuestionMap[LinkType.DECOMPOSITION] = [];
    this.iElinkToQuestionMap[LinkType.DEPENDENCY] = [];
    this.iElinkToQuestionMap[LinkType.ATTACK] = [];
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
    if (isElement(type)) return this.iEelementToQuestionMap[type];
    if (isLink(type)) return this.iElinkToQuestionMap[type];
    console.error("Cannot get critical questions for unknown type: " + type);
    return [];
  }
  getQuestionByName(name) {
    return this.questionByName[name];
  }
}

const questionsDatabase = new CriticalQuestionsDatabase();
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ1", "Is the resource available?", "No", "Yes",
          [ElementType.RESOURCE], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ2a", "Is the task possible?", "No", "Yes",
          [ElementType.TASK], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ2b", "Does the task contribute negatively to some softgoal?", "Yes", "No",
          [ElementType.TASK], CriticalQuestionEffect.INTRO_LINK));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ3", "Can the goal be realized?", "No", "Yes",
          [ElementType.GOAL], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ4", "Is the softgoal legitimate?", "No", "Yes",
          [ElementType.SOFTGOAL], CriticalQuestionEffect.DISABLE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQIntroSrcContr", "Are there alternative #1s that contribute to the same #2?", "Yes", "No",
          [LinkType.CONTRIBUTION], CriticalQuestionEffect.INTRO_SOURCE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQIntroDestContr", "Does the #1 contribute to other #2s?", "Yes", "No",
          [LinkType.CONTRIBUTION], CriticalQuestionEffect.INTRO_DEST));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQIntroSrcDecomp", "Does the #2 decompose into other #1s?", "Yes", "No",
          [LinkType.DECOMPOSITION], CriticalQuestionEffect.INTRO_SOURCE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQIntroDestDecomp", "Does the #1 contribute to other #2s?", "Yes", "No",
          [LinkType.DECOMPOSITION], CriticalQuestionEffect.INTRO_DEST));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ11", "Is the #1 relevant/useful?", "No", "Yes",
          [ElementType.SOFTGOAL, ElementType.GOAL, ElementType.TASK, ElementType.RESOURCE],
          CriticalQuestionEffect.DISABLE));




class IEElement {
  constructor(id, type, name) {
    this.id = id;
    this.names = [name];
    this.type = type;
    this.acceptStatus = ElementAcceptStatus.ACCEPTED;
    this.decompositionType = null;
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
    this.contributionValue = ContributionValue.HELP;
    this.notes = '';
  }

  getName() { 
    return this.type;
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
    // Note that a decomposition link (fromId, toId) means that toId
    // decomposes into fromId.
    this.decompositionMap = {};
    // Map containg elementId -> [attackLink] elements.
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
    const isArgument = this.elementIdMap[id].type == ElementType.ARGUMENT;
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
    if (isArgument) {
      this.computeExtension();
    }
  }

  // Remove link and empties decompostion text if the link is a decomposition
  // and not further decompositions exist to the same element.
  removeLink(id) {
    const decompLink = this.linkIdMap[id];
    const isAttack = decompLink && decompLink.type == LinkType.ATTACK;
    if (decompLink && decompLink.type == LinkType.DECOMPOSITION && 
        !Object.values(this.decompositionMap).some(link => link.toId == decompLink.toId)) {
      const element = this.getElement(decompLink.toId);
      element.decompositionType = null;
      this.getView(element.id).setDecomposition('');

    }
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
    if (isAttack) {
      this.computeExtension();
    }
  }

  addLink(id, insertType, fromId, toId, graphLink) {
    const type = insertTypeToLinkType(insertType);
    const isAttack = type == LinkType.ATTACK;
    if (type == LinkType.UNKNOWN) {
      console.error("Invalid InsertOperation when adding link: ", insertType);
      return;
    }
    let link = isAttack ?
        new AttackLink(id, fromId, toId)
      : new IELink(id, type, fromId, toId);
    this.linkIdMap[id] = link;
    const toElement = this.getElement(link.toId);
    this.insertLinkToMaps(link, type, graphLink);
    if (isAttack) {
      this.computeExtension();
    }
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
        const toElement = this.getElement(link.toId);
        if (!toElement.decompositionType) {
          this.getView(link.toId).setDecomposition('and');
          toElement.decompositionType = DecompositionType.AND;
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

  answerQuestion(id, question, answer, elementName) {
    question.appliedAnswer = answer;
    const map = this.elementIdToAnsweredQuestionsMap;
    if (!map[id] || !map[id].length) map[id] = [question];
    else map[id].push(question);
    question.addedElement = elementName;
  }

  getView(id) {
    return Paper.findViewByModel(this.graphElementMap[id]);
  }

  elementHasAnswer(id, name, answer) {
    return (this.elementIdToAnsweredQuestionsMap[id] || [])
        .filter(question => !answer || question.appliedAnswer == answer)
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
    this.getElement(id).decompositionType = DecompositionType[decompositionType];
    this.getView(id).setDecomposition(decompositionType.toLowerCase());
  }
  // We simply start from each argument, traverse all possible paths from that
  // argument and if we encounter the same argument again we have a cycle.
  hasCycle() {
    const attackMap = this.attackMap;
    for (const keyElementId of Object.keys(this.attackMap)) {
      const visited = [keyElementId];
      const toProcess = attackMap[keyElementId].map(link => link.toId);
      while (toProcess.length) {
        const curElementId = toProcess.splice(toProcess.length-1,1);
        if (visited.indexOf(curElementId) != -1) return true;
        const nextElementIds = (attackMap[curElementId] || []).map(link => link.toId);
        if (nextElementIds.some(id => visited.indexOf(id) != -1)) return true;
        visited.push(curElementId);
        if (nextElementIds.length) {
          toProcess.push.apply(toProcess, nextElementIds);
        }
      }
    }
    return false;
  }

  computeExtension() {
    if (this.hasCycle()) {
      alert('Argumentation network has cycles. This is currently not supported. Please remove the cycles.');
      return;
    }
    // The algorithm goes as follows: 
    // 0. set attack status of all arguments to OUT.
    // 1. start from the unattacked arguments.
    // 2. for each argument A1, recursively set successor A2 as follows:
    //    a. If A1 is IN, A2 is OUT
    //    b. If A1 is OUT 
    //       b1. If all other attackers of A2 are OUT, A2 is IN
    //       b2. If some attacker of A2 is IN, A2 is OUT
    // This process proceeds depth-first.

    // Get attacked elements.
    const attackMap = this.attackMap;
    const allLinks = [].concat.apply([], Object.values(attackMap));
    const unattackedArgumentIds = Object.keys(attackMap).filter(elementId => 
      !allLinks.some(link => link.toId == elementId));
    // Set all elements involved in arguments or attacks to OUT.
    for (const link of allLinks) {
      this.getElement(link.fromId).acceptStatus = ElementAcceptStatus.REJECTED;
      this.getElement(link.toId).acceptStatus = ElementAcceptStatus.REJECTED;
    }
    // Set all other elements to IN.
    for (const [id,elem] of Object.entries(this.elementIdMap)) {
      if (!allLinks.some(link => link.fromId == id || link.toId == id)) {
        elem.acceptStatus = ElementAcceptStatus.ACCEPTED;
      }
    }
    for (const keyArgumentId of unattackedArgumentIds) {
      this.getElement(keyArgumentId).acceptStatus = ElementAcceptStatus.ACCEPTED;
      const toProcess = (attackMap[keyArgumentId] || []).map(link => link.toId);
      while (toProcess.length) {
        const curElementId = toProcess.splice(0,1);
        const curElement = this.getElement(curElementId);
        if (allLinks.some(link => link.toId == curElementId &&
          this.getElement(link.fromId).acceptStatus == ElementAcceptStatus.ACCEPTED)) {
          curElement.acceptStatus = ElementAcceptStatus.REJECTED;
        } else {
          curElement.acceptStatus = ElementAcceptStatus.ACCEPTED;
        }
        const nextElements = attackMap[curElementId];
        if (nextElements && nextElements.length) {
          toProcess.push.apply(toProcess, nextElements.map(link => link.toId));
        }
      }
    }
    this.setElementsColor();
  }

  setElementsColor() {
    for (const [id,elem] of Object.entries(this.elementIdMap)) {
      const view = this.getView(id);
      const isAccepted = elem.acceptStatus == ElementAcceptStatus.ACCEPTED;
      view.model.attr('path/stroke', isAccepted ? ENABLE_COLOR : DISABLE_COLOR);
      view.model.attr('rect/stroke', isAccepted ? ENABLE_COLOR : DISABLE_COLOR);
      if (isAccepted) {
        view.enable();
      } else {
        view.disable();
      }
    }
    for (const [id,link] of Object.entries(this.linkIdMap)) {
      if (link.type == LinkType.ATTACK) continue; // don't disable attack links
      const view = this.getView(id);
      const isAccepted = this.getElement(link.fromId).acceptStatus == ElementAcceptStatus.ACCEPTED &&
                          this.getElement(link.toId).acceptStatus == ElementAcceptStatus.ACCEPTED;
      view.model.attr('.marker-target/stroke', isAccepted ? ENABLE_COLOR : DISABLE_COLOR);
      view.model.attr('.marker-target/fill', isAccepted ? ENABLE_COLOR : DISABLE_COLOR);
      view.model.attr('.marker-source/stroke', isAccepted ? ENABLE_COLOR : DISABLE_COLOR);
      view.model.attr('.connection/stroke', isAccepted ? ENABLE_COLOR : DISABLE_COLOR);
      if (link.type == LinkType.CONTRIBUTION) {
        view.model.prop('labels/0/attrs/text/stroke', isAccepted ? ENABLE_COLOR : DISABLE_COLOR);
      }
    }
  }
}

const rationalGrlModel = new RationalGRLModel();