const XML_VERSION = "1.0";
const ISO_ENCODING = "ISO-8859-1";
const AUTHOR = "RationalGRL (www.rationalgrl.com)";


const HEADER = '<?xml version="' + AUTHOR + '" encoding="' + ISO_ENCODING + '"?>\n' +
    '  <grl-catalog catalog-name="URNspec" description="" author="' + AUTHOR + '">\n';

const FOOTER = '  <actor-def></actor-def>\n' +
    '  <actor-IE-link-def></actor-IE-link-def>\n' +
    '</grl-catalog>';


function getElementDef(element) {
return '    <intentional-element id="' + element.id +'" ' +
        'name="' + element.getName() + '" description="" ' +
        'type="' + element.type + '" decompositiontype="' + (element.decompositionType || DecompositionType.AND) + '"/>';
}

function getElementDefs() {
  let str = ['. <element-def>'];
  for (const element of Object.values(rationalGrlModel.elementIdMap)) {
    if (isIntentionalElement(element.type) &&
          element.acceptStatus == ElementAcceptStatus.ACCEPTED) {
      str.push(getElementDef(element));
    }
  }
  str.push('. </element-def>');
  return str.join('\n') + '\n';
}

function getDecompositionDef(link) {
  return '    <decomposition name="Decomposition" description="" ' +
       'srcid="' + link.fromId + '" ' +
       'destid="' + link.toId + '"/>';
}

function getDependencyDef(link) {
  return '    <dependency name="Dependency" description="" ' +
       'srcid="' + link.fromId + '" ' +
       'destid="' + link.toId + '"/>';
}

function getQuantativeValue(value) {
  switch (value) {
    case ContributionValue.BREAK: return "-100";
    case ContributionValue.SOME_NEGATIVE: return "-75";
    case ContributionValue.HURT: return "-25";
    case ContributionValue.UNKNOWN: return "0";
    case ContributionValue.HELP: return "25";
    case ContributionValue.SOME_POSITIVE: return "75";
    case ContributionValue.MAKE: return "100";
  }
}

function getContributionDef(link) {
  let value = link.contributionValue;
  value = value.substr(0,value.indexOf(' '));
  const quantValue = getQuantativeValue(link.contributionValue);
  return '    <contribution name="Contribution" description="" ' +
       'srcid="' + link.fromId + '" ' +
       'destid="' + link.toId + '" ' +
       'contributiontype="' + value + '" ' +
       'quantitativeContribution="' + quantValue + '" ' +
       'correlation="false"/>';
}

function getLinkDefs() {
  let str = ['  <link-def>'];
  for (const link of Object.values(rationalGrlModel.linkIdMap)) {
    if (isIntentionalLink(link.type) &&
          link.acceptStatus == ElementAcceptStatus.ACCEPTED) {
      switch(link.type) {
        case LinkType.DECOMPOSITION:
          str.push(getDecompositionDef(link));
          break;
        case LinkType.CONTRIBUTION:
          str.push(getContributionDef(link));
          break;
        case LinkType.DEPENDENCY:
          str.push(getDependencyDef(link));
          break;
        default:
          break;
      }
    }
  }
  str.push('  </link-def>');
  return str.join('\n') + '\n';
}

function exportToGrl() {
  const data = HEADER + getElementDefs() + getLinkDefs() + FOOTER;
  const filename = 'rationalGRLExport.grl';
  const type = 'application/xml';
  const file = new Blob([data], {type: type});
  if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
  else { // Others
      var a = document.createElement("a"),
              url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 0);
  }
}
