// Note: This code is messy and requires cleaning up.

// We simply start from each argument, traverse all possible paths from that
// argument and if we encounter the same argument again we have a cycle.
function hasCycle(attackMap) {
  for (const keyElementId of Object.keys(attackMap)) {
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

function computeGroundedExtension(model) {      
  if (hasCycle(model.attackMap)) {
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
  // model process proceeds depth-first.

  // Get unattacked elements.
  const attackMap = model.attackMap;
  const allLinks = [].concat.apply([], Object.values(attackMap));
  const unattackedArgumentIds = Object.keys(attackMap).filter(elementId =>
    !allLinks.some(link => link.toId == elementId));
  // Set all elements involved in arguments or attacks to OUT.
  for (const link of allLinks) {
    model.getElement(link.fromId).acceptStatus = ElementAcceptStatus.OUT;
    model.getElement(link.toId).acceptStatus = ElementAcceptStatus.OUT;
  }
  // Set all other elements to IN.
  for (const [id,elem] of Object.entries(model.elementIdMap)) {
    if (!allLinks.some(link => link.fromId == id || link.toId == id)) {
      elem.acceptStatus = ElementAcceptStatus.IN;
    }
  }
  for (const keyArgumentId of unattackedArgumentIds) {
    model.getElement(keyArgumentId).acceptStatus = ElementAcceptStatus.IN;
    const toProcess = (attackMap[keyArgumentId] || []).map(link => link.toId);
    while (toProcess.length) {
      const curElementId = toProcess.splice(0,1);
      const curElement = model.getElement(curElementId);
      if (allLinks.some(link => link.toId == curElementId &&
        model.getElement(link.fromId).acceptStatus == ElementAcceptStatus.IN)) {
        curElement.acceptStatus = ElementAcceptStatus.OUT;
      } else {
        curElement.acceptStatus = ElementAcceptStatus.IN;
      }
      const nextElements = attackMap[curElementId];
      if (nextElements && nextElements.length) {
        toProcess.push.apply(toProcess, nextElements.map(link => link.toId));
      }
    }
  }
  for (const link of Object.values(model.linkIdMap)) {
    link.acceptStatus = [model.getElement(link.fromId), model.getElement(link.toId)]
        .some(el => el.acceptStatus == ElementAcceptStatus.OUT) ?
        ElementAcceptStatus.OUT : ElementAcceptStatus.IN;
  }
}