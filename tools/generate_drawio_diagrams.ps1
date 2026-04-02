param(
    [string]$OutputDir = (Join-Path (Get-Location) "so-do-drawio")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function U {
    param([AllowNull()][string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    return [System.Text.RegularExpressions.Regex]::Replace(
        $Text,
        "\\u([0-9A-Fa-f]{4})",
        {
            param($match)
            return [char]([Convert]::ToInt32($match.Groups[1].Value, 16))
        })
}

function Repair-Text {
    param([AllowNull()][string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    if ($Text -notmatch "Ã.|Ä.|Å.|Æ.|áº.|á».|â€.|Â.") {
        return $Text
    }

    $cp1252 = [System.Text.Encoding]::GetEncoding(1252)
    $bytes = $cp1252.GetBytes($Text)
    $decoded = [System.Text.Encoding]::UTF8.GetString($bytes)

    return $decoded
}

function Escape-Xml {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text) {
        return ""
    }

    return [System.Security.SecurityElement]::Escape((Repair-Text $Text))
}

function Escape-Label {
    param([AllowNull()][string]$Text)

    $escaped = Escape-Xml $Text
    return $escaped.Replace("`r", "").Replace("`n", "<br/>")
}

function Read-TextUtf8 {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-TextUtf8 {
    param(
        [string]$Path,
        [string]$Content
    )

    $utf8 = [System.Text.UTF8Encoding]::new($true)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

$script:nextId = 1

function Reset-Ids {
    $script:nextId = 1
}

function New-Id {
    $script:nextId += 1
    return [string]$script:nextId
}

function Add-Vertex {
    param(
        [ref]$Cells,
        [string]$Value,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height,
        [string]$Style
    )

    $id = New-Id
    $valueEsc = Escape-Label $Value
    $styleEsc = Escape-Xml $Style

    $xml = "<mxCell id=""$id"" value=""$valueEsc"" style=""$styleEsc"" vertex=""1"" parent=""1""><mxGeometry x=""$X"" y=""$Y"" width=""$Width"" height=""$Height"" as=""geometry""/></mxCell>"
    [void]$Cells.Value.Add($xml)

    return $id
}

function Add-Edge {
    param(
        [ref]$Cells,
        [string]$Source,
        [string]$Target,
        [AllowNull()][string]$Label,
        [string]$Style
    )

    $id = New-Id
    $styleEsc = Escape-Xml $Style
    $labelEsc = Escape-Label $Label
    $valueAttr = if ([string]::IsNullOrWhiteSpace($labelEsc)) { "" } else { " value=""$labelEsc""" }

    $xml = "<mxCell id=""$id""$valueAttr style=""$styleEsc"" edge=""1"" parent=""1"" source=""$Source"" target=""$Target""><mxGeometry relative=""1"" as=""geometry""/></mxCell>"
    [void]$Cells.Value.Add($xml)

    return $id
}

function Add-FreeEdge {
    param(
        [ref]$Cells,
        [int]$SourceX,
        [int]$SourceY,
        [int]$TargetX,
        [int]$TargetY,
        [AllowNull()][string]$Label,
        [string]$Style
    )

    $id = New-Id
    $styleEsc = Escape-Xml $Style
    $labelEsc = Escape-Label $Label
    $valueAttr = if ([string]::IsNullOrWhiteSpace($labelEsc)) { "" } else { " value=""$labelEsc""" }

    $xml = @"
<mxCell id="$id"$valueAttr style="$styleEsc" edge="1" parent="1">
  <mxGeometry relative="1" as="geometry">
    <mxPoint x="$SourceX" y="$SourceY" as="sourcePoint"/>
    <mxPoint x="$TargetX" y="$TargetY" as="targetPoint"/>
  </mxGeometry>
</mxCell>
"@
    [void]$Cells.Value.Add($xml.Trim())

    return $id
}

function Write-DiagramFile {
    param(
        [string]$Path,
        [string]$Name,
        [System.Collections.ArrayList]$Cells,
        [int]$PageWidth = 1600,
        [int]$PageHeight = 1200
    )

    $modified = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $diagramId = [Guid]::NewGuid().ToString("N").Substring(0, 12)
    $nameEsc = Escape-Xml $Name

    $content = @"
<mxfile host="app.diagrams.net" modified="$modified" agent="Codex" version="24.7.17">
  <diagram id="$diagramId" name="$nameEsc">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="$PageWidth" pageHeight="$PageHeight" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
$($Cells -join "`n")
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"@

    Write-TextUtf8 -Path $Path -Content $content
}

function Write-CombinedDrawioFile {
    param(
        [string]$Path,
        [string[]]$SourceFiles
    )

    $modified = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $diagramFragments = [System.Collections.ArrayList]::new()

    foreach ($sourceFile in $SourceFiles) {
        [xml]$document = Read-TextUtf8 -Path $sourceFile
        foreach ($diagram in $document.mxfile.diagram) {
            [void]$diagramFragments.Add($diagram.OuterXml)
        }
    }

    $content = @"
<mxfile host="app.diagrams.net" modified="$modified" agent="Codex" version="24.7.17">
$($diagramFragments -join "`n")
</mxfile>
"@

    Write-TextUtf8 -Path $Path -Content $content
}

$styleTitle = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;fontSize=20;fontStyle=1;"
$styleProcess = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=13;"
$styleDecision = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=12;"
$styleTerminator = "ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=13;"
$styleActor = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;"
$styleUseCase = "ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;"
$styleContainer = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontSize=14;fontStyle=1;"
$styleSubBox = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#666666;fontSize=12;"
$styleEntity = "rounded=0;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;align=left;spacingLeft=8;fontSize=12;"
$styleTable = "rounded=0;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;align=left;spacingLeft=8;fontSize=11;"
$styleEdge = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeWidth=1.5;"
$styleEdgePlain = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;strokeWidth=1.2;"
$styleSequenceBox = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#6c8ebf;fontSize=12;fontStyle=1;"
$styleLifeline = "shape=line;strokeColor=#999999;dashed=1;direction=south;"
$styleSequenceMessage = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;strokeWidth=1.3;"

function Write-ActivityDiagram {
    param(
        [string]$Path,
        [string]$Title,
        [object[]]$Nodes,
        [object[]]$Edges
    )

    Reset-Ids
    $cells = [System.Collections.ArrayList]::new()
    [void](Add-Vertex ([ref]$cells) $Title 520 20 560 40 $styleTitle)

    $map = @{}
    foreach ($node in $Nodes) {
        $style = switch ($node.type) {
            "start" { $styleTerminator }
            "end" { $styleTerminator }
            "decision" { $styleDecision }
            default { $styleProcess }
        }

        $width = if ($node.PSObject.Properties.Name -contains "w") { [int]$node.w } else { 180 }
        $height = if ($node.PSObject.Properties.Name -contains "h") { [int]$node.h } else { 70 }
        $map[$node.key] = Add-Vertex ([ref]$cells) $node.label ([int]$node.x) ([int]$node.y) $width $height $style
    }

    foreach ($edge in $Edges) {
        [void](Add-Edge ([ref]$cells) $map[$edge.from] $map[$edge.to] $edge.label $styleEdge)
    }

    Write-DiagramFile -Path $Path -Name $Title -Cells $cells -PageWidth 1600 -PageHeight 1200
}

function Write-SequenceDiagram {
    param(
        [string]$Path,
        [string]$Title,
        [string[]]$Participants,
        [object[]]$Messages
    )

    Reset-Ids
    $cells = [System.Collections.ArrayList]::new()
    [void](Add-Vertex ([ref]$cells) $Title 500 20 600 40 $styleTitle)

    $participantIds = @{}
    $participantXs = @{}
    $startX = 120
    $stepX = 220
    $headerY = 90
    $lineY = 150
    $lineHeight = 760

    for ($i = 0; $i -lt $Participants.Length; $i++) {
        $x = $startX + ($i * $stepX)
        $participantXs[$Participants[$i]] = $x + 70
        $participantIds[$Participants[$i]] = Add-Vertex ([ref]$cells) $Participants[$i] $x $headerY 140 50 $styleSequenceBox
        [void](Add-Vertex ([ref]$cells) "" ($x + 69) $lineY 2 $lineHeight $styleLifeline)
    }

    $messageY = 190
    foreach ($message in $Messages) {
        [void](Add-FreeEdge ([ref]$cells) $participantXs[$message.from] $messageY $participantXs[$message.to] $messageY $message.label $styleSequenceMessage)
        $messageY += 70
    }

    Write-DiagramFile -Path $Path -Name $Title -Cells $cells -PageWidth 1600 -PageHeight 1200
}

function Write-FunctionalDecompositionDiagram {
    param([string]$Path)

    Reset-Ids
    $cells = [System.Collections.ArrayList]::new()
    [void](Add-Vertex ([ref]$cells) (U "S\u01A1 \u0111\u1ED3 ph\u00E2n c\u1EA5p ch\u1EE9c n\u0103ng") 500 20 600 40 $styleTitle)

    $root = Add-Vertex ([ref]$cells) "Há»‡ thá»‘ng Report Approval" 620 90 260 70 $styleContainer

    $boxes = @{}
    $boxes["auth"] = Add-Vertex ([ref]$cells) "1. Quáº£n lÃ½ xÃ¡c thá»±c" 60 220 210 60 $styleSubBox
    $boxes["report"] = Add-Vertex ([ref]$cells) "2. Quáº£n lÃ½ bÃ¡o cÃ¡o" 330 220 210 60 $styleSubBox
    $boxes["approval"] = Add-Vertex ([ref]$cells) "3. PhÃª duyá»‡t bÃ¡o cÃ¡o" 600 220 210 60 $styleSubBox
    $boxes["task"] = Add-Vertex ([ref]$cells) "4. Quáº£n lÃ½ nhiá»‡m vá»¥" 870 220 210 60 $styleSubBox
    $boxes["admin"] = Add-Vertex ([ref]$cells) "5. Quáº£n trá»‹ há»‡ thá»‘ng" 1140 220 210 60 $styleSubBox

    foreach ($item in $boxes.Keys) {
        [void](Add-Edge ([ref]$cells) $root $boxes[$item] "" $styleEdge)
    }

    $children = @(
        @{ parent = "auth"; x = 40; y = 360; label = "1.1 ÄÄƒng nháº­p" },
        @{ parent = "report"; x = 300; y = 340; label = "2.1 Táº¡o bÃ¡o cÃ¡o thÆ°á»ng" },
        @{ parent = "report"; x = 300; y = 410; label = "2.2 Táº¡o bÃ¡o cÃ¡o theo máº«u" },
        @{ parent = "report"; x = 300; y = 480; label = "2.3 Xem lá»‹ch sá»­ vÃ  ná»™p láº¡i" },
        @{ parent = "approval"; x = 570; y = 340; label = "3.1 Xem danh sÃ¡ch chá» duyá»‡t" },
        @{ parent = "approval"; x = 570; y = 410; label = "3.2 Duyá»‡t / tráº£ bÃ¡o cÃ¡o" },
        @{ parent = "task"; x = 840; y = 340; label = "4.1 Táº¡o nhiá»‡m vá»¥" },
        @{ parent = "task"; x = 840; y = 410; label = "4.2 Cáº­p nháº­t tráº¡ng thÃ¡i" },
        @{ parent = "task"; x = 840; y = 480; label = "4.3 Xem lá»‹ch sá»­ nhiá»‡m vá»¥" },
        @{ parent = "admin"; x = 1110; y = 340; label = "5.1 Quáº£n lÃ½ ngÆ°á»i dÃ¹ng" },
        @{ parent = "admin"; x = 1110; y = 410; label = "5.2 Quáº£n lÃ½ bÃ¡o cÃ¡o / nhiá»‡m vá»¥" },
        @{ parent = "admin"; x = 1110; y = 480; label = "5.3 Xem sá»‘ liá»‡u tá»•ng quan" }
    )

    foreach ($child in $children) {
        $id = Add-Vertex ([ref]$cells) $child.label $child.x $child.y 230 50 $styleSubBox
        [void](Add-Edge ([ref]$cells) $boxes[$child.parent] $id "" $styleEdge)
    }

    Write-DiagramFile -Path $Path -Name (U "S\u01A1 \u0111\u1ED3 ph\u00E2n c\u1EA5p ch\u1EE9c n\u0103ng") -Cells $cells -PageWidth 1500 -PageHeight 900
}

function Write-UseCaseOverviewDiagram {
    param([string]$Path)

    Reset-Ids
    $cells = [System.Collections.ArrayList]::new()
    [void](Add-Vertex ([ref]$cells) (U "S\u01A1 \u0111\u1ED3 use case t\u1ED5ng quan") 500 20 600 40 $styleTitle)

    $system = Add-Vertex ([ref]$cells) "Report Approval System" 330 90 900 690 $styleContainer
    $staff = Add-Vertex ([ref]$cells) "Staff" 70 180 70 140 $styleActor
    $manager = Add-Vertex ([ref]$cells) "Manager" 70 400 80 140 $styleActor
    $director = Add-Vertex ([ref]$cells) "Director" 1270 220 80 140 $styleActor
    $admin = Add-Vertex ([ref]$cells) "Admin" 1270 480 70 140 $styleActor

    $usecases = @{}
    $usecases["login"] = Add-Vertex ([ref]$cells) "ÄÄƒng nháº­p" 470 140 150 60 $styleUseCase
    $usecases["createReport"] = Add-Vertex ([ref]$cells) "Táº¡o bÃ¡o cÃ¡o" 430 250 180 60 $styleUseCase
    $usecases["viewReport"] = Add-Vertex ([ref]$cells) "Xem bÃ¡o cÃ¡o" 700 250 180 60 $styleUseCase
    $usecases["history"] = Add-Vertex ([ref]$cells) "Xem lá»‹ch sá»­ duyá»‡t" 430 360 180 60 $styleUseCase
    $usecases["resubmit"] = Add-Vertex ([ref]$cells) "Ná»™p láº¡i bÃ¡o cÃ¡o" 700 360 180 60 $styleUseCase
    $usecases["approve1"] = Add-Vertex ([ref]$cells) "Duyá»‡t bÃ¡o cÃ¡o cáº¥p 1" 430 470 200 60 $styleUseCase
    $usecases["approve2"] = Add-Vertex ([ref]$cells) "Duyá»‡t bÃ¡o cÃ¡o cáº¥p 2" 700 470 200 60 $styleUseCase
    $usecases["return"] = Add-Vertex ([ref]$cells) "Tráº£ bÃ¡o cÃ¡o" 970 470 150 60 $styleUseCase
    $usecases["createTask"] = Add-Vertex ([ref]$cells) "Táº¡o nhiá»‡m vá»¥" 430 590 180 60 $styleUseCase
    $usecases["updateTask"] = Add-Vertex ([ref]$cells) "Cáº­p nháº­t tráº¡ng thÃ¡i nhiá»‡m vá»¥" 700 590 230 60 $styleUseCase
    $usecases["stats"] = Add-Vertex ([ref]$cells) "Xem thá»‘ng kÃª" 970 590 150 60 $styleUseCase
    $usecases["userMgmt"] = Add-Vertex ([ref]$cells) "Quáº£n lÃ½ ngÆ°á»i dÃ¹ng" 700 700 190 60 $styleUseCase

    $links = @(
        @{ actor = $staff; uc = "login" }, @{ actor = $staff; uc = "createReport" }, @{ actor = $staff; uc = "viewReport" },
        @{ actor = $staff; uc = "history" }, @{ actor = $staff; uc = "resubmit" }, @{ actor = $staff; uc = "updateTask" },
        @{ actor = $manager; uc = "login" }, @{ actor = $manager; uc = "createReport" }, @{ actor = $manager; uc = "viewReport" },
        @{ actor = $manager; uc = "approve1" }, @{ actor = $manager; uc = "return" }, @{ actor = $manager; uc = "createTask" }, @{ actor = $manager; uc = "stats" },
        @{ actor = $director; uc = "login" }, @{ actor = $director; uc = "createReport" }, @{ actor = $director; uc = "viewReport" },
        @{ actor = $director; uc = "approve2" }, @{ actor = $director; uc = "return" }, @{ actor = $director; uc = "createTask" }, @{ actor = $director; uc = "stats" },
        @{ actor = $admin; uc = "login" }, @{ actor = $admin; uc = "createTask" }, @{ actor = $admin; uc = "stats" }, @{ actor = $admin; uc = "userMgmt" }
    )

    foreach ($link in $links) {
        [void](Add-Edge ([ref]$cells) $link.actor $usecases[$link.uc] "" $styleEdgePlain)
    }

    Write-DiagramFile -Path $Path -Name (U "S\u01A1 \u0111\u1ED3 use case t\u1ED5ng quan") -Cells $cells -PageWidth 1500 -PageHeight 950
}

function Write-ErConceptualDiagram {
    param([string]$Path)

    Reset-Ids
    $cells = [System.Collections.ArrayList]::new()
    [void](Add-Vertex ([ref]$cells) "MÃ´ hÃ¬nh ER khÃ¡i niá»‡m" 520 20 560 40 $styleTitle)

    $user = Add-Vertex ([ref]$cells) "Users" 120 260 180 80 $styleEntity
    $report = Add-Vertex ([ref]$cells) "Reports" 470 120 180 80 $styleEntity
    $approval = Add-Vertex ([ref]$cells) "ReportApprovals" 860 120 220 80 $styleEntity
    $task = Add-Vertex ([ref]$cells) "Tasks" 470 430 180 80 $styleEntity
    $taskHistory = Add-Vertex ([ref]$cells) "TaskHistories" 860 430 220 80 $styleEntity

    [void](Add-Edge ([ref]$cells) $user $report "1-N creates" $styleEdge)
    [void](Add-Edge ([ref]$cells) $report $approval "1-N has" $styleEdge)
    [void](Add-Edge ([ref]$cells) $user $approval "1-N approves" $styleEdge)
    [void](Add-Edge ([ref]$cells) $user $task "1-N assigns/receives" $styleEdge)
    [void](Add-Edge ([ref]$cells) $task $taskHistory "1-N has" $styleEdge)
    [void](Add-Edge ([ref]$cells) $user $taskHistory "1-N changes" $styleEdge)

    Write-DiagramFile -Path $Path -Name (U "M\u00F4 h\u00ECnh ER") -Cells $cells -PageWidth 1300 -PageHeight 800
}

function Write-ErdDetailedDiagram {
    param([string]$Path)

    Reset-Ids
    $cells = [System.Collections.ArrayList]::new()
    [void](Add-Vertex ([ref]$cells) (U "S\u01A1 \u0111\u1ED3 ERD chi ti\u1EBFt") 520 20 560 40 $styleTitle)

    $user = Add-Vertex ([ref]$cells) "Users<br/><br/>PK Id<br/>UserName<br/>Password<br/>Role" 40 180 220 180 $styleEntity
    $report = Add-Vertex ([ref]$cells) "Reports<br/><br/>PK Id<br/>Title<br/>Content<br/>Status<br/>ReturnedReason<br/>FileOriginalName<br/>FileStoredName<br/>FileContentType<br/>CurrentLevel<br/>IsApproved<br/>CreatedAt<br/>FK CreatedByUserId" 310 70 280 300 $styleEntity
    $approval = Add-Vertex ([ref]$cells) "ReportApprovals<br/><br/>PK Id<br/>FK ReportId<br/>FK ApproverUserId<br/>Level<br/>Action<br/>Comment<br/>ApprovedAt" 670 90 260 220 $styleEntity
    $task = Add-Vertex ([ref]$cells) "Tasks<br/><br/>PK Id<br/>Title<br/>Description<br/>FK AssignedToUserId<br/>FK AssignedByUserId<br/>DueDate<br/>Status<br/>CompletedAt<br/>FK CompletedByUserId<br/>CreatedAt" 300 430 290 260 $styleEntity
    $taskHistory = Add-Vertex ([ref]$cells) "TaskHistories<br/><br/>PK Id<br/>FK TaskId<br/>Action<br/>Status<br/>Note<br/>FK ChangedByUserId<br/>ChangedAt" 690 460 250 210 $styleEntity

    [void](Add-Edge ([ref]$cells) $user $report "CreatedByUserId" $styleEdge)
    [void](Add-Edge ([ref]$cells) $report $approval "ReportId" $styleEdge)
    [void](Add-Edge ([ref]$cells) $user $approval "ApproverUserId" $styleEdge)
    [void](Add-Edge ([ref]$cells) $user $task "AssignedBy/To/CompletedBy" $styleEdge)
    [void](Add-Edge ([ref]$cells) $task $taskHistory "TaskId" $styleEdge)
    [void](Add-Edge ([ref]$cells) $user $taskHistory "ChangedByUserId" $styleEdge)

    Write-DiagramFile -Path $Path -Name (U "S\u01A1 \u0111\u1ED3 ERD chi ti\u1EBFt") -Cells $cells -PageWidth 1300 -PageHeight 900
}

function Write-TableDesignDiagram {
    param([string]$Path)

    Reset-Ids
    $cells = [System.Collections.ArrayList]::new()
    [void](Add-Vertex ([ref]$cells) "Thiáº¿t káº¿ cÃ¡c báº£ng CSDL" 520 20 560 40 $styleTitle)

    [void](Add-Vertex ([ref]$cells) "Users<br/><br/>Id : integer PK<br/>UserName : text UNIQUE<br/>Password : text<br/>Role : text" 40 120 260 180 $styleTable)
    [void](Add-Vertex ([ref]$cells) "Reports<br/><br/>Id : uuid PK<br/>Title : text<br/>Content : text<br/>Status : text<br/>ReturnedReason : text?<br/>FileOriginalName : text?<br/>FileStoredName : text?<br/>FileContentType : text?<br/>CurrentLevel : integer<br/>IsApproved : boolean<br/>CreatedAt : timestamptz<br/>CreatedByUserId : integer FK" 340 80 320 340 $styleTable)
    [void](Add-Vertex ([ref]$cells) "ReportApprovals<br/><br/>Id : uuid PK<br/>ReportId : uuid FK<br/>ApproverUserId : integer FK<br/>Level : integer<br/>Action : text<br/>Comment : text<br/>ApprovedAt : timestamptz" 720 100 300 240 $styleTable)
    [void](Add-Vertex ([ref]$cells) "Tasks<br/><br/>Id : uuid PK<br/>Title : text<br/>Description : text<br/>AssignedToUserId : integer FK<br/>AssignedByUserId : integer FK<br/>DueDate : timestamptz?<br/>Status : text<br/>CompletedAt : timestamptz?<br/>CompletedByUserId : integer FK?<br/>CreatedAt : timestamptz" 340 470 320 300 $styleTable)
    [void](Add-Vertex ([ref]$cells) "TaskHistories<br/><br/>Id : uuid PK<br/>TaskId : uuid FK<br/>Action : text<br/>Status : text<br/>Note : text<br/>ChangedByUserId : integer FK<br/>ChangedAt : timestamptz" 720 500 300 230 $styleTable)

    Write-DiagramFile -Path $Path -Name (U "Thi\u1EBFt k\u1EBF c\u00E1c b\u1EA3ng CSDL") -Cells $cells -PageWidth 1300 -PageHeight 900
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
    [void](New-Item -ItemType Directory -Path $OutputDir -Force)
}

function Out-Path {
    param([string]$FileName)
    return (Join-Path $OutputDir $FileName)
}

function Save-XmlUtf8 {
    param(
        [xml]$Document,
        [string]$Path
    )

    $utf8 = [System.Text.UTF8Encoding]::new($true)
    [System.IO.File]::WriteAllText($Path, $Document.OuterXml, $utf8)
}

function Normalize-DiagramFile {
    param(
        [string]$Path,
        [AllowNull()][string]$PageName,
        [hashtable]$Replacements
    )

    [xml]$document = Read-TextUtf8 -Path $Path
    $diagramNode = $document.mxfile.diagram

    if ($PageName) {
        $diagramNode.name = $PageName
    }

    foreach ($cell in $document.SelectNodes("//mxCell[@value]")) {
        $value = [string]$cell.value
        if ($Replacements.ContainsKey($value)) {
            $cell.SetAttribute("value", $Replacements[$value])
        }
    }

    if ($PageName) {
        $titleCell = $document.SelectSingleNode("//mxCell[@id='2']")
        if ($null -ne $titleCell) {
            $titleCell.SetAttribute("value", $PageName)
        }
    }

    Save-XmlUtf8 -Document $document -Path $Path
}

$diagramTitles = [ordered]@{
    "01-so-do-phan-cap-chuc-nang.xml" = (U "S\u01A1 \u0111\u1ED3 ph\u00E2n c\u1EA5p ch\u1EE9c n\u0103ng")
    "02-usecase-tong-quan.xml" = (U "S\u01A1 \u0111\u1ED3 use case t\u1ED5ng quan")
    "03-hoat-dong-dang-nhap.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng \u0111\u0103ng nh\u1EADp")
    "04-tuan-tu-dang-nhap.xml" = (U "Tu\u1EA7n t\u1EF1 \u0111\u0103ng nh\u1EADp")
    "05-hoat-dong-tao-bao-cao.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng t\u1EA1o b\u00E1o c\u00E1o")
    "06-tuan-tu-tao-bao-cao.xml" = (U "Tu\u1EA7n t\u1EF1 t\u1EA1o b\u00E1o c\u00E1o")
    "07-hoat-dong-duyet-bao-cao.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng duy\u1EC7t b\u00E1o c\u00E1o")
    "08-tuan-tu-duyet-bao-cao.xml" = (U "Tu\u1EA7n t\u1EF1 duy\u1EC7t b\u00E1o c\u00E1o")
    "09-hoat-dong-tra-bao-cao.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng tr\u1EA3 b\u00E1o c\u00E1o")
    "10-tuan-tu-tra-bao-cao.xml" = (U "Tu\u1EA7n t\u1EF1 tr\u1EA3 b\u00E1o c\u00E1o")
    "11-hoat-dong-nop-lai-bao-cao.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng n\u1ED9p l\u1EA1i b\u00E1o c\u00E1o")
    "12-tuan-tu-nop-lai-bao-cao.xml" = (U "Tu\u1EA7n t\u1EF1 n\u1ED9p l\u1EA1i b\u00E1o c\u00E1o")
    "13-hoat-dong-tao-nhiem-vu.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng t\u1EA1o nhi\u1EC7m v\u1EE5")
    "14-tuan-tu-tao-nhiem-vu.xml" = (U "Tu\u1EA7n t\u1EF1 t\u1EA1o nhi\u1EC7m v\u1EE5")
    "15-hoat-dong-cap-nhat-trang-thai-nhiem-vu.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng c\u1EADp nh\u1EADt tr\u1EA1ng th\u00E1i nhi\u1EC7m v\u1EE5")
    "16-tuan-tu-cap-nhat-trang-thai-nhiem-vu.xml" = (U "Tu\u1EA7n t\u1EF1 c\u1EADp nh\u1EADt tr\u1EA1ng th\u00E1i nhi\u1EC7m v\u1EE5")
    "17-hoat-dong-quan-ly-nguoi-dung.xml" = (U "Ho\u1EA1t \u0111\u1ED9ng qu\u1EA3n l\u00FD ng\u01B0\u1EDDi d\u00F9ng")
    "18-tuan-tu-quan-ly-nguoi-dung.xml" = (U "Tu\u1EA7n t\u1EF1 qu\u1EA3n l\u00FD ng\u01B0\u1EDDi d\u00F9ng")
    "19-mo-hinh-er.xml" = (U "M\u00F4 h\u00ECnh ER kh\u00E1i ni\u1EC7m")
    "20-so-do-erd.xml" = (U "S\u01A1 \u0111\u1ED3 ERD")
    "21-thiet-ke-cac-bang-csdl.xml" = (U "Thi\u1EBFt k\u1EBF c\u00E1c b\u1EA3ng CSDL")
}

$labelReplacements = @{
    "Report Approval System" = (U "H\u1EC7 th\u1ED1ng Report Approval")
    "Staff" = (U "Nh\u00E2n vi\u00EAn")
    "Manager" = (U "Tr\u01B0\u1EDFng ph\u00F2ng")
    "Director" = (U "Gi\u00E1m \u0111\u1ED1c")
    "Admin" = (U "Qu\u1EA3n tr\u1ECB vi\u00EAn")
    "Frontend" = (U "Giao di\u1EC7n")
    "AuthController" = (U "API x\u00E1c th\u1EF1c")
    "AppDbContext" = (U "CSDL \u1EE9ng d\u1EE5ng")
    "JwtTokenService" = (U "D\u1ECBch v\u1EE5 JWT")
    "ReportsController" = (U "API b\u00E1o c\u00E1o")
    "ReportService" = (U "D\u1ECBch v\u1EE5 b\u00E1o c\u00E1o")
    "ReportApprovalController" = (U "API ph\u00EA duy\u1EC7t")
    "TasksController" = (U "API nhi\u1EC7m v\u1EE5")
    "TaskService" = (U "D\u1ECBch v\u1EE5 nhi\u1EC7m v\u1EE5")
    "AdminController" = (U "API qu\u1EA3n tr\u1ECB")
    "Uploads" = (U "Kho t\u1EC7p \u0111\u00EDnh k\u00E8m")
    "PostgreSQL" = (U "CSDL PostgreSQL")
    (U "L\u00E3nh \u0111\u1EA1o/Admin") = (U "L\u00E3nh \u0111\u1EA1o/Qu\u1EA3n tr\u1ECB vi\u00EAn")
    (U "Frontend g\u1EEDi POST /api/auth/login") = (U "Giao di\u1EC7n g\u1EEDi POST /api/auth/login")
    (U "Frontend l\u01B0u session") = (U "Giao di\u1EC7n l\u01B0u phi\u00EAn \u0111\u0103ng nh\u1EADp")
    (U "Backend t\u1EA1o JWT") = (U "M\u00E1y ch\u1EE7 t\u1EA1o JWT")
    (U "Frontend sinh content + file Excel") = (U "Giao di\u1EC7n sinh n\u1ED9i dung + file Excel")
    (U "Backend ki\u1EC3m tra user, file v\u00E0 workflow") = (U "M\u00E1y ch\u1EE7 ki\u1EC3m tra ng\u01B0\u1EDDi d\u00F9ng, t\u1EC7p v\u00E0 lu\u1ED3ng duy\u1EC7t")
    (U "Manager hay Director?") = (U "Tr\u01B0\u1EDFng ph\u00F2ng hay gi\u00E1m \u0111\u1ED1c?")
    (U "L\u01B0u l\u1ECBch s\u1EED Approved") = (U "L\u01B0u l\u1ECBch s\u1EED \u0111\u00E3 duy\u1EC7t (Approved)")
    (U "C\u1EADp nh\u1EADt PendingDirector") = (U "C\u1EADp nh\u1EADt ch\u1EDD gi\u00E1m \u0111\u1ED1c")
    (U "C\u1EADp nh\u1EADt Approved") = (U "C\u1EADp nh\u1EADt \u0111\u00E3 duy\u1EC7t (Approved)")
    (U "L\u01B0u ReturnedByManager v\u00E0 c\u1EADp nh\u1EADt Returned") = (U "L\u01B0u tr\u1EA3 b\u1EDFi tr\u01B0\u1EDFng ph\u00F2ng v\u00E0 c\u1EADp nh\u1EADt tr\u1EA3 l\u1EA1i (Returned)")
    (U "L\u01B0u ReturnedByDirector v\u00E0 c\u1EADp nh\u1EADt PendingManager") = (U "L\u01B0u tr\u1EA3 b\u1EDFi gi\u00E1m \u0111\u1ED1c v\u00E0 c\u1EADp nh\u1EADt ch\u1EDD tr\u01B0\u1EDFng ph\u00F2ng")
    (U "G\u1EEDi y\u00EAu c\u1EA7u resubmit") = (U "G\u1EEDi y\u00EAu c\u1EA7u n\u1ED9p l\u1EA1i")
    (U "C\u00F3 \u0111\u00FAng owner v\u00E0 status Returned?") = (U "C\u00F3 \u0111\u00FAng ng\u01B0\u1EDDi s\u1EDF h\u1EEFu v\u00E0 tr\u1EA1ng th\u00E1i tr\u1EA3 l\u1EA1i (Returned)?")
    (U "L\u01B0u file m\u1EDBi, c\u1EADp nh\u1EADt Reports v\u00E0 l\u1ECBch s\u1EED Resubmitted") = (U "L\u01B0u file m\u1EDBi, c\u1EADp nh\u1EADt b\u00E1o c\u00E1o v\u00E0 l\u1ECBch s\u1EED n\u1ED9p l\u1EA1i (Resubmitted)")
    (U "Quay v\u1EC1 PendingManager") = (U "Quay v\u1EC1 ch\u1EDD tr\u01B0\u1EDFng ph\u00F2ng")
    (U "Ng\u01B0\u1EDDi nh\u1EADn l\u00E0 Staff?") = (U "Ng\u01B0\u1EDDi nh\u1EADn l\u00E0 nh\u00E2n vi\u00EAn?")
    (U "L\u01B0u Tasks v\u00E0 TaskHistories(Assigned)") = (U "L\u01B0u nhi\u1EC7m v\u1EE5 v\u00E0 l\u1ECBch s\u1EED \u0111\u00E3 giao (Assigned)")
    (U "Staff m\u1EDF danh s\u00E1ch nhi\u1EC7m v\u1EE5") = (U "Nh\u00E2n vi\u00EAn m\u1EDF danh s\u00E1ch nhi\u1EC7m v\u1EE5")
    (U "Ch\u1ECDn tr\u1EA1ng th\u00E1i Todo / InProgress / Done") = (U "Ch\u1ECDn tr\u1EA1ng th\u00E1i C\u1EA7n l\u00E0m / \u0110ang th\u1EF1c hi\u1EC7n / Ho\u00E0n th\u00E0nh")
    (U "Task c\u00F3 thu\u1ED9c Staff hi\u1EC7n t\u1EA1i?") = (U "Nhi\u1EC7m v\u1EE5 c\u00F3 thu\u1ED9c nh\u00E2n vi\u00EAn hi\u1EC7n t\u1EA1i?")
    (U "Tr\u1EA1ng th\u00E1i m\u1EDBi l\u00E0 Done?") = (U "Tr\u1EA1ng th\u00E1i m\u1EDBi l\u00E0 ho\u00E0n th\u00E0nh (Done)?")
    (U "L\u01B0u TaskHistories") = (U "L\u01B0u l\u1ECBch s\u1EED nhi\u1EC7m v\u1EE5 (TaskHistories)")
    "ReturnToStaffAsync(...)" = (U "X\u1EED l\u00FD tr\u1EA3 b\u00E1o c\u00E1o")
    (U "Admin m\u1EDF trang qu\u1EA3n tr\u1ECB") = (U "Qu\u1EA3n tr\u1ECB vi\u00EAn m\u1EDF trang qu\u1EA3n tr\u1ECB")
    (U "Ch\u1ECDn t\u1EA1o / \u0111\u1ED5i role / x\u00F3a user") = (U "Ch\u1ECDn t\u1EA1o / \u0111\u1ED5i vai tr\u00F2 / x\u00F3a ng\u01B0\u1EDDi d\u00F9ng")
}

Write-FunctionalDecompositionDiagram -Path (Out-Path "01-so-do-phan-cap-chuc-nang.xml")
Write-UseCaseOverviewDiagram -Path (Out-Path "02-usecase-tong-quan.xml")

$activityLoginNodes = @(
    @{ key = "start"; type = "start"; label = "Báº¯t Ä‘áº§u"; x = 120; y = 140; w = 120; h = 50 },
    @{ key = "input"; type = "process"; label = "NgÆ°á»i dÃ¹ng nháº­p username vÃ  password"; x = 320; y = 130; w = 220; h = 70 },
    @{ key = "send"; type = "process"; label = "Frontend gá»­i POST /api/auth/login"; x = 620; y = 130; w = 220; h = 70 },
    @{ key = "check"; type = "decision"; label = "ThÃ´ng tin há»£p lá»‡?"; x = 930; y = 125; w = 150; h = 90 },
    @{ key = "error"; type = "process"; label = "ThÃ´ng bÃ¡o lá»—i Ä‘Äƒng nháº­p"; x = 1180; y = 80; w = 220; h = 70 },
    @{ key = "jwt"; type = "process"; label = "Backend táº¡o JWT"; x = 1180; y = 210; w = 220; h = 70 },
    @{ key = "save"; type = "process"; label = "Frontend lÆ°u session"; x = 1180; y = 330; w = 220; h = 70 },
    @{ key = "end"; type = "end"; label = "Äiá»u hÆ°á»›ng theo vai trÃ²"; x = 1180; y = 450; w = 220; h = 50 }
)
$activityLoginEdges = @(
    @{ from = "start"; to = "input"; label = "" },
    @{ from = "input"; to = "send"; label = "" },
    @{ from = "send"; to = "check"; label = "" },
    @{ from = "check"; to = "error"; label = "KhÃ´ng" },
    @{ from = "check"; to = "jwt"; label = "CÃ³" },
    @{ from = "jwt"; to = "save"; label = "" },
    @{ from = "save"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "03-hoat-dong-dang-nhap.xml") -Title "Hoáº¡t Ä‘á»™ng Ä‘Äƒng nháº­p" -Nodes $activityLoginNodes -Edges $activityLoginEdges

Write-SequenceDiagram -Path (Out-Path "04-tuan-tu-dang-nhap.xml") -Title "Tuáº§n tá»± Ä‘Äƒng nháº­p" -Participants @("NgÆ°á»i dÃ¹ng", "Frontend", "AuthController", "AppDbContext", "JwtTokenService") -Messages @(
    @{ from = "NgÆ°á»i dÃ¹ng"; to = "Frontend"; label = "Nháº­p tÃ i khoáº£n vÃ  máº­t kháº©u" },
    @{ from = "Frontend"; to = "AuthController"; label = "POST /api/auth/login" },
    @{ from = "AuthController"; to = "AppDbContext"; label = "TÃ¬m user theo UserName" },
    @{ from = "AppDbContext"; to = "AuthController"; label = "Tráº£ thÃ´ng tin user" },
    @{ from = "AuthController"; to = "JwtTokenService"; label = "CreateSession(user)" },
    @{ from = "JwtTokenService"; to = "AuthController"; label = "AccessToken + User" },
    @{ from = "AuthController"; to = "Frontend"; label = "200 OK" },
    @{ from = "Frontend"; to = "NgÆ°á»i dÃ¹ng"; label = "VÃ o dashboard theo role" }
)

$activityCreateReportNodes = @(
    @{ key = "start"; type = "start"; label = "Má»Ÿ form"; x = 90; y = 160; w = 110; h = 50 },
    @{ key = "choose"; type = "decision"; label = "Chá»n bÃ¡o cÃ¡o thÆ°á»ng hay theo máº«u?"; x = 250; y = 140; w = 180; h = 90 },
    @{ key = "normal"; type = "process"; label = "Nháº­p tiÃªu Ä‘á» vÃ  ná»™i dung"; x = 500; y = 80; w = 220; h = 70 },
    @{ key = "template"; type = "process"; label = "Nháº­p dá»¯ liá»‡u máº«u"; x = 500; y = 220; w = 220; h = 70 },
    @{ key = "generate"; type = "process"; label = "Frontend sinh content + file Excel"; x = 790; y = 220; w = 250; h = 70 },
    @{ key = "submit"; type = "process"; label = "Gá»­i POST /api/reports"; x = 790; y = 100; w = 250; h = 70 },
    @{ key = "validate"; type = "process"; label = "Backend kiá»ƒm tra user, file vÃ  workflow"; x = 1110; y = 100; w = 250; h = 70 },
    @{ key = "save"; type = "process"; label = "LÆ°u Reports vÃ  ReportApprovals"; x = 1110; y = 220; w = 250; h = 70 },
    @{ key = "end"; type = "end"; label = "Tráº£ káº¿t quáº£ táº¡o bÃ¡o cÃ¡o"; x = 1110; y = 340; w = 250; h = 50 }
)
$activityCreateReportEdges = @(
    @{ from = "start"; to = "choose"; label = "" },
    @{ from = "choose"; to = "normal"; label = "ThÆ°á»ng" },
    @{ from = "choose"; to = "template"; label = "Theo máº«u" },
    @{ from = "template"; to = "generate"; label = "" },
    @{ from = "normal"; to = "submit"; label = "" },
    @{ from = "generate"; to = "submit"; label = "" },
    @{ from = "submit"; to = "validate"; label = "" },
    @{ from = "validate"; to = "save"; label = "" },
    @{ from = "save"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "05-hoat-dong-tao-bao-cao.xml") -Title "Hoáº¡t Ä‘á»™ng táº¡o bÃ¡o cÃ¡o" -Nodes $activityCreateReportNodes -Edges $activityCreateReportEdges

Write-SequenceDiagram -Path (Out-Path "06-tuan-tu-tao-bao-cao.xml") -Title "Tuáº§n tá»± táº¡o bÃ¡o cÃ¡o" -Participants @("NgÆ°á»i táº¡o", "Frontend", "ReportsController", "ReportService", "Uploads", "PostgreSQL") -Messages @(
    @{ from = "NgÆ°á»i táº¡o"; to = "Frontend"; label = "Nháº­p dá»¯ liá»‡u bÃ¡o cÃ¡o" },
    @{ from = "Frontend"; to = "ReportsController"; label = "POST /api/reports" },
    @{ from = "ReportsController"; to = "ReportService"; label = "CreateReportAsync(...)" },
    @{ from = "ReportService"; to = "Uploads"; label = "LÆ°u file Ä‘Ã­nh kÃ¨m náº¿u cÃ³" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "TÃ¬m user + xÃ¡c Ä‘á»‹nh workflow" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Insert Reports" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Insert ReportApprovals(Submitted)" },
    @{ from = "ReportService"; to = "ReportsController"; label = "ReportDto" },
    @{ from = "ReportsController"; to = "Frontend"; label = "201 Created" }
)

$activityApproveNodes = @(
    @{ key = "start"; type = "start"; label = "Má»Ÿ danh sÃ¡ch chá» duyá»‡t"; x = 80; y = 160; w = 150; h = 50 },
    @{ key = "select"; type = "process"; label = "Chá»n bÃ¡o cÃ¡o vÃ  nháº­p ghi chÃº"; x = 300; y = 150; w = 220; h = 70 },
    @{ key = "send"; type = "process"; label = "Gá»­i yÃªu cáº§u duyá»‡t"; x = 600; y = 150; w = 200; h = 70 },
    @{ key = "check"; type = "decision"; label = "ÄÃºng cáº¥p duyá»‡t?"; x = 870; y = 145; w = 160; h = 90 },
    @{ key = "error"; type = "process"; label = "ThÃ´ng bÃ¡o lá»—i"; x = 1100; y = 80; w = 220; h = 70 },
    @{ key = "history"; type = "process"; label = "LÆ°u lá»‹ch sá»­ Approved"; x = 1100; y = 210; w = 220; h = 70 },
    @{ key = "final"; type = "decision"; label = "ÄÃ£ lÃ  cáº¥p cuá»‘i?"; x = 1100; y = 340; w = 160; h = 90 },
    @{ key = "pending2"; type = "process"; label = "Cáº­p nháº­t PendingDirector"; x = 1340; y = 260; w = 220; h = 70 },
    @{ key = "approved"; type = "process"; label = "Cáº­p nháº­t Approved"; x = 1340; y = 380; w = 220; h = 70 },
    @{ key = "end"; type = "end"; label = "Tráº£ káº¿t quáº£"; x = 1340; y = 500; w = 220; h = 50 }
)
$activityApproveEdges = @(
    @{ from = "start"; to = "select"; label = "" },
    @{ from = "select"; to = "send"; label = "" },
    @{ from = "send"; to = "check"; label = "" },
    @{ from = "check"; to = "error"; label = "KhÃ´ng" },
    @{ from = "check"; to = "history"; label = "CÃ³" },
    @{ from = "history"; to = "final"; label = "" },
    @{ from = "final"; to = "pending2"; label = "ChÆ°a" },
    @{ from = "final"; to = "approved"; label = "Roi" },
    @{ from = "pending2"; to = "end"; label = "" },
    @{ from = "approved"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "07-hoat-dong-duyet-bao-cao.xml") -Title "Hoáº¡t Ä‘á»™ng duyá»‡t bÃ¡o cÃ¡o" -Nodes $activityApproveNodes -Edges $activityApproveEdges

Write-SequenceDiagram -Path (Out-Path "08-tuan-tu-duyet-bao-cao.xml") -Title "Tuáº§n tá»± duyá»‡t bÃ¡o cÃ¡o" -Participants @("NgÆ°á»i duyá»‡t", "Frontend", "ReportApprovalController", "ReportService", "PostgreSQL") -Messages @(
    @{ from = "NgÆ°á»i duyá»‡t"; to = "Frontend"; label = "Chá»n duyá»‡t bÃ¡o cÃ¡o" },
    @{ from = "Frontend"; to = "ReportApprovalController"; label = "POST /report-approvals/{id}/approve" },
    @{ from = "ReportApprovalController"; to = "ReportService"; label = "ApproveAsync(...)" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "TÃ¬m report + approver" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Kiá»ƒm tra CurrentLevel" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Insert ReportApprovals(Approved)" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Update Reports(Status, Level)" },
    @{ from = "ReportApprovalController"; to = "Frontend"; label = "200 OK" }
)

$activityReturnNodes = @(
    @{ key = "start"; type = "start"; label = "Chá»n bÃ¡o cÃ¡o cáº§n tráº£"; x = 80; y = 160; w = 150; h = 50 },
    @{ key = "reason"; type = "process"; label = "Nháº­p lÃ½ do tráº£ vá»"; x = 310; y = 150; w = 220; h = 70 },
    @{ key = "send"; type = "process"; label = "Gá»­i yÃªu cáº§u tráº£ bÃ¡o cÃ¡o"; x = 610; y = 150; w = 220; h = 70 },
    @{ key = "who"; type = "decision"; label = "Manager hay Director?"; x = 910; y = 145; w = 170; h = 90 },
    @{ key = "m"; type = "process"; label = "LÆ°u ReturnedByManager vÃ  cáº­p nháº­t Returned"; x = 1160; y = 80; w = 280; h = 70 },
    @{ key = "d"; type = "process"; label = "LÆ°u ReturnedByDirector vÃ  cáº­p nháº­t PendingManager"; x = 1160; y = 220; w = 300; h = 70 },
    @{ key = "end"; type = "end"; label = "Tráº£ káº¿t quáº£"; x = 1160; y = 360; w = 220; h = 50 }
)
$activityReturnEdges = @(
    @{ from = "start"; to = "reason"; label = "" },
    @{ from = "reason"; to = "send"; label = "" },
    @{ from = "send"; to = "who"; label = "" },
    @{ from = "who"; to = "m"; label = "Manager" },
    @{ from = "who"; to = "d"; label = "Director" },
    @{ from = "m"; to = "end"; label = "" },
    @{ from = "d"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "09-hoat-dong-tra-bao-cao.xml") -Title "Hoáº¡t Ä‘á»™ng tráº£ bÃ¡o cÃ¡o" -Nodes $activityReturnNodes -Edges $activityReturnEdges

Write-SequenceDiagram -Path (Out-Path "10-tuan-tu-tra-bao-cao.xml") -Title "Tuáº§n tá»± tráº£ bÃ¡o cÃ¡o" -Participants @("NgÆ°á»i duyá»‡t", "Frontend", "ReportApprovalController", "ReportService", "PostgreSQL") -Messages @(
    @{ from = "NgÆ°á»i duyá»‡t"; to = "Frontend"; label = "Nháº­p lÃ½ do tráº£ bÃ¡o cÃ¡o" },
    @{ from = "Frontend"; to = "ReportApprovalController"; label = "POST /report-approvals/{id}/return" },
    @{ from = "ReportApprovalController"; to = "ReportService"; label = "ReturnToStaffAsync(...)" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "TÃ¬m report + approver" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Kiá»ƒm tra role vÃ  CurrentLevel" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Insert lá»‹ch sá»­ tráº£ bÃ¡o cÃ¡o" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Update Reports(Status, Level)" },
    @{ from = "ReportApprovalController"; to = "Frontend"; label = "200 OK" }
)

$activityResubmitNodes = @(
    @{ key = "start"; type = "start"; label = "Má»Ÿ bÃ¡o cÃ¡o bá»‹ tráº£"; x = 90; y = 160; w = 140; h = 50 },
    @{ key = "edit"; type = "process"; label = "Chá»‰nh sá»­a tiÃªu Ä‘á», ná»™i dung hoáº·c máº«u"; x = 300; y = 150; w = 240; h = 70 },
    @{ key = "file"; type = "process"; label = "Chá»n file má»›i náº¿u cÃ³"; x = 620; y = 150; w = 220; h = 70 },
    @{ key = "send"; type = "process"; label = "Gá»­i yÃªu cáº§u resubmit"; x = 920; y = 150; w = 220; h = 70 },
    @{ key = "check"; type = "decision"; label = "CÃ³ Ä‘Ãºng owner vÃ  status Returned?"; x = 1210; y = 145; w = 190; h = 90 },
    @{ key = "error"; type = "process"; label = "ThÃ´ng bÃ¡o lá»—i"; x = 1460; y = 80; w = 200; h = 70 },
    @{ key = "save"; type = "process"; label = "LÆ°u file má»›i, cáº­p nháº­t Reports vÃ  lá»‹ch sá»­ Resubmitted"; x = 1460; y = 220; w = 280; h = 80 },
    @{ key = "end"; type = "end"; label = "Quay vá» PendingManager"; x = 1460; y = 360; w = 220; h = 50 }
)
$activityResubmitEdges = @(
    @{ from = "start"; to = "edit"; label = "" },
    @{ from = "edit"; to = "file"; label = "" },
    @{ from = "file"; to = "send"; label = "" },
    @{ from = "send"; to = "check"; label = "" },
    @{ from = "check"; to = "error"; label = "KhÃ´ng" },
    @{ from = "check"; to = "save"; label = "CÃ³" },
    @{ from = "save"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "11-hoat-dong-nop-lai-bao-cao.xml") -Title "Hoáº¡t Ä‘á»™ng ná»™p láº¡i bÃ¡o cÃ¡o" -Nodes $activityResubmitNodes -Edges $activityResubmitEdges

Write-SequenceDiagram -Path (Out-Path "12-tuan-tu-nop-lai-bao-cao.xml") -Title "Tuáº§n tá»± ná»™p láº¡i bÃ¡o cÃ¡o" -Participants @("Staff", "Frontend", "ReportsController", "ReportService", "Uploads", "PostgreSQL") -Messages @(
    @{ from = "Staff"; to = "Frontend"; label = "Chá»‰nh sá»­a bÃ¡o cÃ¡o" },
    @{ from = "Frontend"; to = "ReportsController"; label = "POST /reports/{id}/resubmit" },
    @{ from = "ReportsController"; to = "ReportService"; label = "ResubmitAsync(...)" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "TÃ¬m report + kiá»ƒm tra owner" },
    @{ from = "ReportService"; to = "Uploads"; label = "XÃ³a file cÅ© / lÆ°u file má»›i" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Update Reports" },
    @{ from = "ReportService"; to = "PostgreSQL"; label = "Insert ReportApprovals(Resubmitted)" },
    @{ from = "ReportsController"; to = "Frontend"; label = "200 OK" }
)

$activityTaskCreateNodes = @(
    @{ key = "start"; type = "start"; label = "Má»Ÿ form giao viá»‡c"; x = 80; y = 160; w = 140; h = 50 },
    @{ key = "input"; type = "process"; label = "Nháº­p tiÃªu Ä‘á», mÃ´ táº£, háº¡n vÃ  ngÆ°á»i nháº­n"; x = 290; y = 150; w = 260; h = 70 },
    @{ key = "send"; type = "process"; label = "Gá»­i POST /api/tasks"; x = 620; y = 150; w = 210; h = 70 },
    @{ key = "assigner"; type = "decision"; label = "NgÆ°á»i giao há»£p lá»‡?"; x = 900; y = 145; w = 160; h = 90 },
    @{ key = "error"; type = "process"; label = "ThÃ´ng bÃ¡o lá»—i"; x = 1140; y = 80; w = 220; h = 70 },
    @{ key = "assignee"; type = "decision"; label = "NgÆ°á»i nháº­n lÃ  Staff?"; x = 1140; y = 220; w = 170; h = 90 },
    @{ key = "save"; type = "process"; label = "LÆ°u Tasks vÃ  TaskHistories(Assigned)"; x = 1390; y = 220; w = 260; h = 70 },
    @{ key = "end"; type = "end"; label = "Tráº£ káº¿t quáº£"; x = 1390; y = 360; w = 220; h = 50 }
)
$activityTaskCreateEdges = @(
    @{ from = "start"; to = "input"; label = "" },
    @{ from = "input"; to = "send"; label = "" },
    @{ from = "send"; to = "assigner"; label = "" },
    @{ from = "assigner"; to = "error"; label = "KhÃ´ng" },
    @{ from = "assigner"; to = "assignee"; label = "CÃ³" },
    @{ from = "assignee"; to = "error"; label = "KhÃ´ng" },
    @{ from = "assignee"; to = "save"; label = "CÃ³" },
    @{ from = "save"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "13-hoat-dong-tao-nhiem-vu.xml") -Title "Hoáº¡t Ä‘á»™ng táº¡o nhiá»‡m vá»¥" -Nodes $activityTaskCreateNodes -Edges $activityTaskCreateEdges

Write-SequenceDiagram -Path (Out-Path "14-tuan-tu-tao-nhiem-vu.xml") -Title "Tuáº§n tá»± táº¡o nhiá»‡m vá»¥" -Participants @("LÃ£nh Ä‘áº¡o/Admin", "Frontend", "TasksController", "TaskService", "PostgreSQL") -Messages @(
    @{ from = "LÃ£nh Ä‘áº¡o/Admin"; to = "Frontend"; label = "Nháº­p thÃ´ng tin giao viá»‡c" },
    @{ from = "Frontend"; to = "TasksController"; label = "POST /api/tasks" },
    @{ from = "TasksController"; to = "TaskService"; label = "CreateTaskAsync(...)" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "TÃ¬m assigner + assignee" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "Kiá»ƒm tra role" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "Insert Tasks" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "Insert TaskHistories(Assigned)" },
    @{ from = "TasksController"; to = "Frontend"; label = "200 OK" }
)

$activityTaskStatusNodes = @(
    @{ key = "start"; type = "start"; label = "Staff má»Ÿ danh sÃ¡ch nhiá»‡m vá»¥"; x = 90; y = 160; w = 160; h = 50 },
    @{ key = "select"; type = "process"; label = "Chá»n tráº¡ng thÃ¡i Todo / InProgress / Done"; x = 320; y = 150; w = 260; h = 70 },
    @{ key = "send"; type = "process"; label = "Gá»­i PATCH cáº­p nháº­t tráº¡ng thÃ¡i"; x = 660; y = 150; w = 240; h = 70 },
    @{ key = "owner"; type = "decision"; label = "Task cÃ³ thuá»™c Staff hiá»‡n táº¡i?"; x = 970; y = 145; w = 180; h = 90 },
    @{ key = "error"; type = "process"; label = "ThÃ´ng bÃ¡o lá»—i"; x = 1210; y = 80; w = 220; h = 70 },
    @{ key = "done"; type = "decision"; label = "Tráº¡ng thÃ¡i má»›i lÃ  Done?"; x = 1210; y = 220; w = 180; h = 90 },
    @{ key = "complete"; type = "process"; label = "Cáº­p nháº­t CompletedAt vÃ  CompletedByUserId"; x = 1470; y = 170; w = 260; h = 70 },
    @{ key = "normal"; type = "process"; label = "Cáº­p nháº­t tráº¡ng thÃ¡i thÆ°á»ng"; x = 1470; y = 290; w = 220; h = 70 },
    @{ key = "history"; type = "process"; label = "LÆ°u TaskHistories"; x = 1470; y = 410; w = 220; h = 70 },
    @{ key = "end"; type = "end"; label = "Tráº£ káº¿t quáº£"; x = 1470; y = 530; w = 220; h = 50 }
)
$activityTaskStatusEdges = @(
    @{ from = "start"; to = "select"; label = "" },
    @{ from = "select"; to = "send"; label = "" },
    @{ from = "send"; to = "owner"; label = "" },
    @{ from = "owner"; to = "error"; label = "KhÃ´ng" },
    @{ from = "owner"; to = "done"; label = "CÃ³" },
    @{ from = "done"; to = "complete"; label = "CÃ³" },
    @{ from = "done"; to = "normal"; label = "KhÃ´ng" },
    @{ from = "complete"; to = "history"; label = "" },
    @{ from = "normal"; to = "history"; label = "" },
    @{ from = "history"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "15-hoat-dong-cap-nhat-trang-thai-nhiem-vu.xml") -Title "Hoáº¡t Ä‘á»™ng cáº­p nháº­t tráº¡ng thÃ¡i nhiá»‡m vá»¥" -Nodes $activityTaskStatusNodes -Edges $activityTaskStatusEdges

Write-SequenceDiagram -Path (Out-Path "16-tuan-tu-cap-nhat-trang-thai-nhiem-vu.xml") -Title "Tuáº§n tá»± cáº­p nháº­t tráº¡ng thÃ¡i nhiá»‡m vá»¥" -Participants @("Staff", "Frontend", "TasksController", "TaskService", "PostgreSQL") -Messages @(
    @{ from = "Staff"; to = "Frontend"; label = "Chá»n tráº¡ng thÃ¡i má»›i" },
    @{ from = "Frontend"; to = "TasksController"; label = "PATCH /api/tasks/{id}/status" },
    @{ from = "TasksController"; to = "TaskService"; label = "UpdateStatusAsync(...)" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "TÃ¬m task" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "Kiá»ƒm tra AssignedToUserId" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "Update Tasks(Status, CompletedAt)" },
    @{ from = "TaskService"; to = "PostgreSQL"; label = "Insert TaskHistories" },
    @{ from = "TasksController"; to = "Frontend"; label = "200 OK" }
)

$activityAdminNodes = @(
    @{ key = "start"; type = "start"; label = "Admin má»Ÿ trang quáº£n trá»‹"; x = 70; y = 160; w = 160; h = 50 },
    @{ key = "choose"; type = "decision"; label = "Chá»n táº¡o / Ä‘á»•i role / xÃ³a user"; x = 290; y = 145; w = 190; h = 90 },
    @{ key = "input"; type = "process"; label = "Nháº­p dá»¯ liá»‡u thao tÃ¡c"; x = 560; y = 145; w = 220; h = 70 },
    @{ key = "validate"; type = "decision"; label = "Dá»¯ liá»‡u vÃ  rÃ ng buá»™c há»£p lá»‡?"; x = 860; y = 145; w = 190; h = 90 },
    @{ key = "error"; type = "process"; label = "ThÃ´ng bÃ¡o lá»—i"; x = 1130; y = 80; w = 220; h = 70 },
    @{ key = "save"; type = "process"; label = "Cáº­p nháº­t dá»¯ liá»‡u ngÆ°á»i dÃ¹ng"; x = 1130; y = 220; w = 240; h = 70 },
    @{ key = "end"; type = "end"; label = "Tráº£ káº¿t quáº£"; x = 1130; y = 360; w = 220; h = 50 }
)
$activityAdminEdges = @(
    @{ from = "start"; to = "choose"; label = "" },
    @{ from = "choose"; to = "input"; label = "" },
    @{ from = "input"; to = "validate"; label = "" },
    @{ from = "validate"; to = "error"; label = "KhÃ´ng" },
    @{ from = "validate"; to = "save"; label = "CÃ³" },
    @{ from = "save"; to = "end"; label = "" }
)
Write-ActivityDiagram -Path (Out-Path "17-hoat-dong-quan-ly-nguoi-dung.xml") -Title "Hoáº¡t Ä‘á»™ng quáº£n lÃ½ ngÆ°á»i dÃ¹ng" -Nodes $activityAdminNodes -Edges $activityAdminEdges

Write-SequenceDiagram -Path (Out-Path "18-tuan-tu-quan-ly-nguoi-dung.xml") -Title "Tuáº§n tá»± quáº£n lÃ½ ngÆ°á»i dÃ¹ng" -Participants @("Admin", "Frontend", "AdminController", "PostgreSQL") -Messages @(
    @{ from = "Admin"; to = "Frontend"; label = "Thá»±c hiá»‡n thao tÃ¡c quáº£n trá»‹" },
    @{ from = "Frontend"; to = "AdminController"; label = "POST/PATCH/DELETE /api/admin/users..." },
    @{ from = "AdminController"; to = "PostgreSQL"; label = "Kiá»ƒm tra user, role, dá»¯ liá»‡u liÃªn quan" },
    @{ from = "AdminController"; to = "PostgreSQL"; label = "Insert/Update/Delete Users" },
    @{ from = "AdminController"; to = "Frontend"; label = "Káº¿t quáº£ thao tÃ¡c" }
)

Write-ErConceptualDiagram -Path (Out-Path "19-mo-hinh-er.xml")
Write-ErdDetailedDiagram -Path (Out-Path "20-so-do-erd.xml")
Write-TableDesignDiagram -Path (Out-Path "21-thiet-ke-cac-bang-csdl.xml")

$sourceFiles = @(
    $diagramTitles.Keys | ForEach-Object {
        $filePath = Out-Path $_
        Normalize-DiagramFile -Path $filePath -PageName $diagramTitles[$_] -Replacements $labelReplacements
        $filePath
    }
)

$combinedPath = Out-Path "00-tat-ca-so-do.xml"
Write-CombinedDrawioFile -Path $combinedPath -SourceFiles $sourceFiles

Get-ChildItem -LiteralPath $OutputDir -Filter *.xml | ForEach-Object {
    [void][xml](Read-TextUtf8 -Path $_.FullName)
}

Write-Host "Da tao cac file draw.io XML tai: $OutputDir"
Get-ChildItem -LiteralPath $OutputDir -Filter *.xml | Sort-Object Name | Select-Object -ExpandProperty Name
