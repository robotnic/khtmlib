<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

<xsl:template match="/">
<html>
<body>
<xsl:apply-templates select="*"/>
</body>
</html>
</xsl:template>

<xsl:template match="*">
<div style="margin-left:10px">
<xsl:text>&lt;</xsl:text>

<span style="color:red">
<xsl:value-of select="name()"/>
</span>
<xsl:for-each select="@*">
	<xsl:text> </xsl:text>
	<span style="color:green">
		<xsl:value-of select="name()"/>
	</span>
	<xsl:text>="</xsl:text>
	<span style="color:blue">
		<xsl:value-of select="."/>
	</span>
	<xsl:text>"</xsl:text>
</xsl:for-each>
<xsl:text>&gt;</xsl:text>
<xsl:choose>
	<xsl:when test="name()='script' or name()='style'">
		<pre>
			<xsl:value-of select="."/>
		</pre>
	</xsl:when>
	<xsl:otherwise>
		<xsl:apply-templates select="*|text()"/>
	</xsl:otherwise>
</xsl:choose>

<xsl:text>&lt;/</xsl:text>
<span style="color:red">
<xsl:value-of select="name()"/>
</span>
<xsl:text>&gt;</xsl:text>
</div>
</xsl:template>


</xsl:stylesheet>
