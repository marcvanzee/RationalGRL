IN = ElementAcceptStatus.IN
OUT = ElementAcceptStatus.OUT
MUST_OUT = "Must Out"
UNDECIDED = ElementAcceptStatus.UNDECIDED

function reverseAttackRelation(arguments, attackRelation) {
  let reversedAttacks = {}
  for (const attacker of arguments) {
    reversedAttacks[attacker] = reversedAttacks[attacker] || [];
    if (!(attacker in attackRelation)) { continue; }
    for (const attacked of attackRelation[attacker]) {
      reversedAttacks[attacked] = reversedAttacks[attacked] || [];
      if (!(attacker in reversedAttacks[attacked])) {
        reversedAttacks[attacked].push(attacker);
      } 
    }
  }
  return reversedAttacks;
}

function computeGroundedExtension(arguments, attackRelation) {
  reverseAttack = reverseAttackRelation(arguments, attackRelation);

  let labels = {}
  for (arg of arguments) { labels[arg] = UNDECIDED; }

  // The main queue of arguments that we know for certain to be IN
  let toProcess = arguments.filter(arg => reverseAttack[arg].length == 0);

  while (toProcess.length > 0) {
    let newToProcess = [];
    for (arg of toProcess) {
      someAttackerIsIn = reverseAttack[arg].some(a => labels[a] == IN);
      allAttackersAreOut = reverseAttack[arg].every(a => labels[a] == OUT);
      if (!someAttackerIsIn && !allAttackersAreOut) { continue; }
      if (someAttackerIsIn) { labels[arg] = OUT; }
      if (allAttackersAreOut) { labels[arg] = IN; }
      argsToProcess = (attackRelation[arg] || []).filter(a => labels[a] == UNDECIDED);
      newToProcess.push(...argsToProcess);
    }
    toProcess = newToProcess;
  }
  return labels;
}
