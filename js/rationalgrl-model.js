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
  new CriticalQuestion("CQ2b", "Does the task have any negative side-effects?", "Yes", "No",
          [ElementType.TASK], CriticalQuestionEffect.DISABLE));
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
  new CriticalQuestion("CQIntroDestDecomp", "Is the #1 a decomposition for other #2s?", "Yes", "No",
          [LinkType.DECOMPOSITION], CriticalQuestionEffect.INTRO_DEST));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQIntroSrcDep", "Does the #2 depend on other #1s?", "Yes", "No",
          [LinkType.DEPENDENCY], CriticalQuestionEffect.INTRO_SOURCE));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQIntroDestDep", "Is the #1 a dependency for other #2s?", "Yes", "No",
          [LinkType.DEPENDENCY], CriticalQuestionEffect.INTRO_DEST));
questionsDatabase.addQuestion(
  new CriticalQuestion("CQ11", "Is the #1 relevant/useful?", "No", "Yes",
          [ElementType.SOFTGOAL, ElementType.GOAL, ElementType.TASK, ElementType.RESOURCE],
          CriticalQuestionEffect.DISABLE));


class IEElement {
  constructor(id, type, name) {
    this.id = id;
    this.names = [name];
    this.type = type;
    this.acceptStatus = ElementAcceptStatus.IN;
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
    this.acceptStatus = ElementAcceptStatus.IN;
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
    this.acceptStatus = ElementAcceptStatus.IN;
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

    this.preferredSemantics = new PreferredSemantics();
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
  // and no further decompositions exist to the same element.
  removeLink(id) {
    const link = this.linkIdMap[id];
    const isAttack = link && link.type == LinkType.ATTACK;
    const isDecompLink = link && link.type == LinkType.DECOMPOSITION;
    const decompLinks = [].concat.apply([], Object.values(this.decompositionMap));
    if (isDecompLink && !decompLinks
          .some(decompLink => decompLink.toId == link.toId 
                && decompLink.id != link.id)) {
      const element = this.getElement(link.toId);
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

  linkArgumentToQuestion(id, question) {
    this.argumentIdToCriticalQuestionMap[id] = question;
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

  getArguments() {
    let args = [];
    for (let arg of Object.values(this.elementIdMap)) {
      if (arg instanceof Argument) {
        args.push(arg.id);
      }
    }
    return args;
  }

  getAttackRelation() {
    let attackRelation = {}
    for (const [fromId, attackLinks] of Object.entries(this.attackMap)) {
      let toIds = [];
      for (const attackLink of attackLinks) { toIds.push(attackLink.toId); }
      attackRelation[fromId] = toIds;
    }
    return attackRelation;
  }

  computeExtension() {
    const args = this.getArguments();
    const attacks = this.getAttackRelation();
    // We use the grounded extension.t
    const extension = computeGroundedExtension(args, attacks);
    // The preferred extension is still experimental.
    // const extensions = getPreferredExtensions(args, attacks);

    for (const [id, label] of Object.entries(extension)) {
      this.getElement(id).acceptStatus = label;
    }

    this.setElementsColor();
  }

  setElementsColor() {
    for (const [id,elem] of Object.entries(this.elementIdMap)) {
      const view = this.getView(id);
      const isAccepted = elem.acceptStatus == ElementAcceptStatus.IN;
      let box_color = DISABLE_COLOR;
      if (elem.acceptStatus == ElementAcceptStatus.OUT) {
        box_color = OUT_COLOR;
      } else if (elem.acceptStatus == ElementAcceptStatus.IN) {
        box_color = ENABLE_COLOR;
      }
      view.model.attr('path/stroke', box_color);
      view.model.attr('rect/stroke', box_color);
      if (isAccepted) {
        view.enable();
      } else {
        view.disable();
      }
    }
    for (const [id,link] of Object.entries(this.linkIdMap)) {
      if (link.type == LinkType.ATTACK) continue; // don't disable attack links
      const view = this.getView(id);
      const isAccepted = this.getElement(link.fromId).acceptStatus == ElementAcceptStatus.IN &&
                          this.getElement(link.toId).acceptStatus == ElementAcceptStatus.IN;
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
