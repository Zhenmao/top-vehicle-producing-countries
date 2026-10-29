d3.csv("data/data.csv", d3.autoType).then((data) => {
  ///////////////////////////////////////////////////////////
  //// Setup ////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  const accessors = {
    country: (d) => d["COUNTRY"],
    flag: (d) => d["FLAG"],
    continent: (d) => d["CONTINENT"],
    note: (d) => d["NOTE"],
    prevValue: (d) => d["YTD 2024"],
    currValue: (d) => d["YTD 2025"],
    change: (d) => (d["YTD 2025"] - d["YTD 2024"]) / d["YTD 2024"],
    prevRank: (d) => d["RANK 2024"],
    currRank: (d) => d["RANK 2025"],
  };

  const prevTitle = "2024";
  const currTitle = "2025";

  // Prev icons | Prev value | Prev name | Prev rank | Link | Curr rank | Curr name | Curr value } Curr icons | Percent change
  const marginTop = 24;
  const marginRight = 4;
  const marginBottom = 4;
  const marginLeft = 4;

  const linkColumnWidth = 240;
  const linkRankGap = 4;
  const rankColumnWidth = 32;
  const rankNameGap = 16;
  const nameColumnWidth = 134;
  const nameIconGap = 16;
  const valuePerIcon = 1000000;
  const iconSize = 24;
  const iconGapX = 8;
  const iconGapY = 0;
  const iconsPerRow = 5;
  const iconColumnWidth = iconSize * iconsPerRow + iconGapX * (iconsPerRow - 1);
  const iconValueGap = 16;
  const valueColumnWidth = 36;
  const valueChangeGap = 16;
  const changeColumnWidth = 66;

  const linkHeight = 24;
  const rowGap = 24;

  const colorScale = d3
    .scaleOrdinal()
    .domain(["ASIA", "AMERICA", "EUROPE"])
    .range([
      "var(--color-asia)",
      "var(--color-america)",
      "var(--color-europe)",
    ]);

  const textColorScale = colorScale
    .copy()
    .range([
      "var(--color-text)",
      "var(--color-text)",
      "var(--color-background)",
    ]);

  const colorChangeScale = d3
    .scaleOrdinal()
    .domain([-1, 1])
    .range(["var(--color-decrease)", "var(--color-increase)"]);

  const formatValue = (d) => {
    const fractionDigits = d >= 1000000 ? 1 : 0;
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(d);
  };

  const formatChange = (d) =>
    new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      signDisplay: "exceptZero",
    }).format(d);

  ///////////////////////////////////////////////////////////
  //// Process data /////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  const nodes = [];
  const links = [];

  data.forEach((d, i) => {
    const name = accessors.country(d);
    const flag = accessors.flag(d);
    const continent = accessors.continent(d);
    const color = colorScale(continent);
    const textColor = textColorScale(continent);

    const prevValue = accessors.prevValue(d);
    const prevIcons = prevValue / valuePerIcon;

    const prevNode = {
      sign: -1,
      name,
      flag,
      color,
      textColor,
      rank: accessors.prevRank(d),
      value: prevValue,
      icons: prevIcons,
    };

    const change = accessors.change(d);
    const changeColor = colorChangeScale(Math.sign(change));

    const currValue = accessors.currValue(d);
    const currIcons = currValue / valuePerIcon;

    const currNode = {
      sign: 1,
      name,
      flag,
      color,
      textColor,
      rank: accessors.currRank(d),
      value: currValue,
      change,
      changeColor,
      icons: currIcons,
    };

    nodes.push(prevNode, currNode);
    links.push({
      name,
      color,
      source: prevNode,
      target: currNode,
    });
  });

  ///////////////////////////////////////////////////////////
  //// Layout ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  let height;

  let y = marginTop + linkHeight / 2;

  d3.group(nodes, (d) => d.rank).forEach(([prevNode, currNode], i, n) => {
    prevNode.y = currNode.y = y;

    const prevIconsHeight =
      Math.ceil(prevNode.icons / iconsPerRow) * (iconSize + iconGapY) -
      iconGapY;
    const currIconsHeight =
      Math.ceil(currNode.icons / iconsPerRow) * (iconSize + iconGapY) -
      iconGapY;
    const rowHeight = Math.max(
      linkHeight,
      prevIconsHeight - iconSize / 2 + linkHeight / 2,
      currIconsHeight - iconSize / 2 + linkHeight / 2,
    );

    if (i === n.size) {
      y += rowHeight - linkHeight / 2;
      height = y + marginBottom;
    } else {
      y += rowHeight + rowGap;
    }
  });

  const xLink = linkColumnWidth / 2;
  const xRank = xLink + linkRankGap;
  const xName = xRank + rankColumnWidth + rankNameGap;
  const xIcon = xName + nameColumnWidth + nameIconGap;
  const xValue = xIcon + iconColumnWidth + iconValueGap;
  const xChange = xValue + valueColumnWidth + valueChangeGap;

  const prevWidth = xChange - valueChangeGap;
  const currWidth = xChange + changeColumnWidth;
  const viewBox = [
    -prevWidth - marginLeft,
    0,
    prevWidth + currWidth + marginLeft + marginRight,
    height,
  ];

  ///////////////////////////////////////////////////////////
  //// Render ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  const container = d3.select("#chart").classed("chart", true);
  const svg = container
    .append("svg")
    .attr("width", viewBox[2])
    .attr("height", viewBox[3])
    .attr("viewBox", viewBox);

  //// Time /////////////////////////////////////////////////
  svg
    .append("g")
    .attr("class", "times")
    .attr("text-anchor", "middle")
    .selectChildren()
    .data([
      {
        x: -xRank - rankColumnWidth / 2,
        text: prevTitle,
      },
      {
        x: xRank + rankColumnWidth / 2,
        text: currTitle,
      },
    ])
    .join("text")
    .attr("class", "time")
    .attr("x", (d) => d.x)
    .attr("y", marginTop - 8)
    .text((d) => d.text);

  //// Link /////////////////////////////////////////////////
  const linkPathGenerator = d3
    .linkHorizontal()
    .x((d) => d.sign * xLink)
    .y((d) => d.y);

  svg
    .append("g")
    .attr("class", "links")
    .selectChildren()
    .data(links)
    .join("path")
    .attr("class", "link")
    .attr("stroke", (d) => d.color)
    .attr("stroke-width", linkHeight)
    .attr("d", linkPathGenerator);

  //// Rank /////////////////////////////////////////////////
  const rankG = svg
    .append("g")
    .attr("class", "ranks")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .selectChildren()
    .data(nodes)
    .join("g")
    .attr("class", "rank")
    .attr("transform", (d) => `translate(0,${d.y})`);

  rankG
    .append("rect")
    .attr("class", "rank__rect")
    .attr("x", (d) => (d.sign === -1 ? -xRank - rankColumnWidth : xRank))
    .attr("y", -linkHeight / 2)
    .attr("width", rankColumnWidth)
    .attr("height", linkHeight)
    .attr("fill", (d) => d.color);

  rankG
    .append("text")
    .attr("class", "rank__label")
    .attr("x", (d) => d.sign * (xRank + rankColumnWidth / 2))
    .style("color", (d) => d.textColor)
    .text((d) => d.rank);

  //// Name /////////////////////////////////////////////////
  const nameG = svg
    .append("g")
    .attr("class", "names")
    .attr("dominant-baseline", "central")
    .selectChildren()
    .data(nodes)
    .join("g")
    .attr("class", "name")
    .attr("transform", (d) => `translate(0,${d.y})`);

  nameG
    .append("text")
    .attr("class", "name__label")
    .attr("x", (d) => d.sign * xName)
    .attr("text-anchor", (d) => (d.sign === -1 ? "end" : "start"))
    .text((d) =>
      (d.sign === -1 ? [d.name, d.flag] : [d.flag, d.name]).join(" "),
    );

  //// Icons ////////////////////////////////////////////////
  const iconG = svg
    .append("g")
    .attr("class", "icons")
    .selectChildren()
    .data(nodes)
    .join("g")
    .attr("class", "name")
    .attr("transform", (d) => `translate(0,${d.y})`);

  iconG.each(function (d) {
    // Generate icons data
    const icons = [
      ...d3.range(Math.floor(d.icons)).map((i) => ({ i, ratio: 1 })),
      { i: Math.floor(d.icons), ratio: 1, color: "var(--color-ghost)" },
      { i: Math.floor(d.icons), ratio: d.icons % 1 },
    ].map(({ i, ratio, color }) => {
      const col = i % iconsPerRow;
      const row = Math.floor(i / iconsPerRow);
      return {
        col,
        row,
        color,
        ratio,
      };
    });

    const x = (e) =>
      d.sign === -1
        ? -xIcon - iconSize - e.col * (iconSize + iconGapX)
        : xIcon + e.col * (iconSize + iconGapX);
    const y = (e) => -iconSize / 2 + e.row * (iconSize + iconGapY);

    d3.select(this)
      .selectChildren()
      .data(icons)
      .join("use")
      .attr("href", "#car")
      .style("color", (e) => e.color || d.color)
      .attr("x", x)
      .attr("y", y)
      .attr("width", (e) => e.ratio * iconSize)
      .attr("height", iconSize);
  });

  //// Value ////////////////////////////////////////////////
  const valueG = svg
    .append("g")
    .attr("class", "values")
    .attr("dominant-baseline", "central")
    .selectChildren()
    .data(nodes)
    .join("g")
    .attr("class", "value")
    .attr("transform", (d) => `translate(0,${d.y})`);

  valueG
    .append("text")
    .attr("class", "value__label")
    .attr("x", (d) => d.sign * xValue)
    .attr("text-anchor", (d) => (d.sign === -1 ? "end" : "start"))
    .text((d) => formatValue(d.value));

  //// Change ///////////////////////////////////////////////
  const changeG = svg
    .append("g")
    .attr("class", "changes")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .selectChildren()
    .data(nodes)
    .join("g")
    .attr("class", "change")
    .attr("transform", (d) => `translate(0,${d.y})`);

  changeG
    .append("rect")
    .attr("class", "change__rect")
    .attr("x", (d) => (d.sign === -1 ? -xChange - changeColumnWidth : xChange))
    .attr("y", -linkHeight / 2)
    .attr("width", changeColumnWidth)
    .attr("height", linkHeight)
    .attr("fill", (d) => d.changeColor);

  changeG
    .append("text")
    .attr("class", "change__label")
    .attr("x", (d) => d.sign * (xChange + changeColumnWidth / 2))
    .text((d) => formatChange(d.change));
});
