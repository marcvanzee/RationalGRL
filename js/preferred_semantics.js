// This code is rewritten from a Java implementation by Bas Testerink.
// Thanks a lot, Bas!

IN = ElementAcceptStatus.IN
OUT = ElementAcceptStatus.OUT
MUST_OUT = "Must Out"
UNDECIDED = ElementAcceptStatus.UNDECIDED

class SearchState {
  // arguments is a list of arguments ids.
  // attackRelation is a map from arguments ids to sets of arguments ids.
  constructor(args, attackRelation) {
    this.labeling = {};
    this.labelings = [];
    this.blanks = new Set(args)

    this.attackRelation = attackRelation;
    this.attackRelationReversed = reverseAttackRelation(args, attackRelation);
    this.nrMustOut = 0;
  }

  setLabel(argument, label) {
    this.labeling[argument] = label;
  }

  getLabel(argument) { return this.labeling[argument]; }

  getAttackers(argument) { 
    return this.attackRelationReversed[argument] || new Set();
  }

  getAttackedArguments(argument) { 
    return this.attackRelation[argument] || new Set();
  }

  done() { return this.blanks.size == 0; }

  getBlankArgument() { 
    const argument = this.blanks.values().next().value
    this.blanks.delete(argument);
    return argument;
  }

  label(argument, label) {
    const previous = this.labeling[argument];
    if (previous == null) {
      this.blanks.delete(argument);
    }
    if (label == MUST_OUT && (previous == null || previous == UNDECIDED)) {
      this.nrMustOut++;
      this.labeling[argument] = label;
    } else if (label == OUT && previous == MUST_OUT) {
      this.nrMustOut--;
      this.labeling[argument] = label;
    } else if (previous == null || previous == UNDECIDED) {
      this.labeling[argument] = label;
    }
  }

  undoLabel(argument, label) {
    const previous = this.labeling[argument];
    if (previous != label) {
      if (previous == MUST_OUT) {
        this.nrMustOut--;
      } else if (label == MUST_OUT) {
        this.nrMustOut++;
      }
      this.labeling[argument] = label;
      if (label == null) {
        this.blanks.add(argument);
      }
    }
  }

  storeLabelingIfPossiblyPreferredExtension() {
    // A MUST_OUT is a label that should always be later-on verified to
    // be OUT. Otherwise, it is 'unnecessarily' labeled out
    if (this.nrMustOut > 0) {
      return;
    }

    let toRemove = [];

    let getIns = (labeling) => Object.keys(labeling).filter((arg) => {
        return labeling[arg] === IN
    });
    let containsAll = (arr1, arr2) => arr1.every(val => arr2.includes(val));

    for (const oldLabeling of this.labelings) {
      const oldIn = getIns(oldLabeling);
      const newIn = getIns(this.labeling);
      if (containsAll(newIn, oldIn)) {
        toRemove.push(oldLabeling);
      } else if (containsAll(oldIn, newIn)) {
        // Note that if the new labeling is already contained, then there is no
        // labeling which is encapsulated by the new labeling (otherwise that
        // labeling would have been encapsulated as well by the labeling that
        // encapsulates the new labeling).
        return;
      }
    }

    this.labelings = this.labelings.filter(item => !toRemove.includes(item))

    labeling_copy = {}
    Object.assign(labeling_copy, this.labeling)

    // Store a copy of the labeling
    this.labelings.push(labeling_copy);
  }

  getExtensions() { return this.labelings; }
}


class PreferredSemantics {
  getExtensions(args, attackRelations) {
    let search = new SearchState(args, attackRelations);
    this.label(search)
    return search.getExtensions();
  }

  label(search) {
    if (search.done()) {
      search.storeLabelingIfPossiblyPreferredExtension();
      return;
    }
    const blank = search.getBlankArgument();

    // Remember the labels that you might overwrite
    if (!search.getAttackers(blank).has(blank)) {
      let overwritten = {};
      for (const attacker of search.getAttackers(blank)) {
        overwritten[attacker] = search.getLabel(attacker);
      }
      for (const attacked of search.getAttackedArguments(blank)) {
        overwritten[attacked] = search.getLabel(attacked);
      }

      // Label the blank IN
      search.setLabel(blank, IN);
      // Attacked arguments are now OUT, and the attackers must be out
      for (const attacked of search.getAttackedArguments(blank)) {
        search.label(attacked, OUT);
      }
      for (const attacker of search.getAttackers(blank)) {
        search.label(attacker, MUST_OUT);
      }

      // Continue the search
      this.label(search);

      // Undo the IN-transition labeling
      for (const [key, value] of Object.entries(overwritten)) {
        search.undoLabel(key, value);
      }
    }

    // Collection the blank to undecided and continue
    search.setLabel(blank, UNDECIDED);
    this.label(search);

    // Undo the label and continue with parent call
    search.undoLabel(blank, null);
  }
}

function computePreferredExtension(arguments, attackRelation) {
  preferredSemantics = new PreferredSemantics();
  return preferredSemantics.getExtensions(arguments, attackRelation);
}