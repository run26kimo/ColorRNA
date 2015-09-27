/**
 * Created by 语冰 on 2015/9/22.
 */

function ColorRNA()
{
//---私有

    this._xyz = {X: 0, Y: 0, Z: 0};

    this._gamma = -2.2; //gamma 变换值； _gamma < 0 表示 sRGB 模式
    this._colorSpace = "sRGB";
    this._refWhiteName = "D65";
    this._refWhiteNameUSER = "";//强制制度值
    this._adtAlg = "Bradford";
    this._doAdapta = true;
    this._doAdaptaUSER = 0;// 0 默认，1 强制使用，-1 强制不使用


    this._dLV = 1; //计算精度 2：16位, 1：7位, 0：4位;

    this._COLORSPACES =
    {
        sRGB: "sRGB",
        AdobeRGB: "AdobeRGB",
        AppleRGB: "AppleRGB",
        BestRGB: "BestRGB",
        BetaRGB: "BetaRGB",
        BruceRGB: "BruceRGB",
        CIERGB: "CIERGB",
        ColorMatchRGB: "ColorMatchRGB",
        ECIRGBv2: "ECIRGBv2",
        DonRGB4: "DonRGB4",
        EktaSpacePS5: "EktaSpacePS5",
        NTSCRGB: "NTSCRGB",
        PALSECAMRGB: "PALSECAMRGB",
        ProPhotoRGB: "ProPhotoRGB",
        SMPTECRGB: "SMPTECRGB",
        WideGamutRGB: "WideGamutRGB"
    }
    this._REFWHITES =
    {
        A: "A",
        B: "B",
        C: "C",
        D50: "D50",
        D55: "D55",
        D65: "D65",
        D75: "D75",
        E: "E",
        F2: "F2",
        F7: "F7",
        F11: "F11"
    }


    this._adt_refWhite = {X: 0, Y: 0, Z: 0};// 参考白
    this._adt_refWhiteRGB = {X: 0, Y: 0, Z: 0};// RGB 色彩空间参考白
    this._adt_mtxAdaptMa = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    this._adt_mtxAdaptMaI = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];


//---in RGB-----------------------
    if (arguments.length == 3)
    {
        this.colorType = "RGB"

        if (typeof arguments[0] == "number")
        {
            this.r = arguments[0];
        }

        if (typeof arguments[1] == "number")
        {
            this.g = arguments[1];
        }

        if (typeof arguments[2] == "number")
        {
            this.b = arguments[2];
        }
    }

}

//---原型函数--------------------------------------------------------------------------------------------------


//取 RGB 值，如：#ffffff
ColorRNA.prototype._RGBstring = function ()
{
    return "#" + this.r.toString(16) + this.g.toString(16) + this.b.toString(16)
}

ColorRNA.prototype._arrayProduct = function (inArray, inArray2)
{
    var sum = 0;
    for (var z = 0; z < inArray.length; z++)
    {
        sum += inArray[z] * inArray2[z];
    }

    return sum;
}


//把一个数 inNumber 归一化；inMax,inMin 为原最大最小区间，newMax 为新最大值；如果只有一个参数将按[0,255] 归一化到 [0,1]
ColorRNA.prototype._normaliz = function (inNumber, inMin, inMax, newMax)
{
    var newNumber = 0;

    if (arguments.length == 4)
    {
        newNumber = (inNumber - inMin) / (inMax - inMin);
        newNumber = newNumber * newMax;
    }
    else
    {
        newNumber = arguments[0] / 255;
    }

    return newNumber;
}

ColorRNA.prototype._arrayFixed = function (inArray, Number)
{
    for (var z = 0; z < inArray.length; z++)
    {
        inArray[z] = +inArray[z].toFixed(Number);
    }
}

ColorRNA.prototype._arrayRound = function (inArray)
{
    for (var z = 0; z < inArray.length; z++)
    {

        inArray[z] = Math.round(inArray[z]);
    }
}


//对已经归一化的 RGB 值进行  Gamma 2.2 的变换，
ColorRNA.prototype._enGamma = function (rgb)
{
    var newRGB = 0;
    var sign = 1;

    if (rgb < 0)//处理负数情况
    {
        sign = -1;
        rgb = -rgb;
    }


    if (this._gamma < 0)//----sRGB-----------
    {

        if (rgb <= 0.0031306684425005883)
        {
            newRGB = sign * rgb * 12.92;
        }
        else
        {
            newRGB = sign * 1.055 * Math.pow(rgb, 0.416666666666666667) - 0.055 //0.416666666666666667 = 1/2.4;
        }
    }
    if (this._gamma == 0)//-----L*-----------
    {

        if (rgb <= (216.0 / 24389.0))
        {
            newRGB = sign * (rgb * 24389.0 / 2700.0);
        }
        else
        {
            newRGB = sign * (1.16 * Math.pow(rgb, 1.0 / 3.0) - 0.16);
        }
    }
    if (this._gamma > 0)//-----普通 Gamma-----------
    {

        newRGB = sign * Math.pow(rgb, 1 / this._gamma);
    }


    return newRGB;

}


ColorRNA.prototype._adt_adaptation = function (lightName, algName)
{

    this._adt_setRefWhite(lightName);
    this._adt_setAdaptMa(algName);


    var Ad = this._adt_refWhite.X * this._adt_mtxAdaptMa[0][0] + this._adt_refWhite.Y * this._adt_mtxAdaptMa[1][0] + this._adt_refWhite.Z * this._adt_mtxAdaptMa[2][0];
    var Bd = this._adt_refWhite.X * this._adt_mtxAdaptMa[0][1] + this._adt_refWhite.Y * this._adt_mtxAdaptMa[1][1] + this._adt_refWhite.Z * this._adt_mtxAdaptMa[2][1];
    var Cd = this._adt_refWhite.X * this._adt_mtxAdaptMa[0][2] + this._adt_refWhite.Y * this._adt_mtxAdaptMa[1][2] + this._adt_refWhite.Z * this._adt_mtxAdaptMa[2][2];


    var As = this._adt_refWhiteRGB.X * this._adt_mtxAdaptMa[0][0] + this._adt_refWhiteRGB.Y * this._adt_mtxAdaptMa[1][0] + this._adt_refWhiteRGB.Z * this._adt_mtxAdaptMa[2][0];
    var Bs = this._adt_refWhiteRGB.X * this._adt_mtxAdaptMa[0][1] + this._adt_refWhiteRGB.Y * this._adt_mtxAdaptMa[1][1] + this._adt_refWhiteRGB.Z * this._adt_mtxAdaptMa[2][1];
    var Cs = this._adt_refWhiteRGB.X * this._adt_mtxAdaptMa[0][2] + this._adt_refWhiteRGB.Y * this._adt_mtxAdaptMa[1][2] + this._adt_refWhiteRGB.Z * this._adt_mtxAdaptMa[2][2];

    var X = this._xyz.X * this._adt_mtxAdaptMa[0][0] + this._xyz.Y * this._adt_mtxAdaptMa[1][0] + this._xyz.Z * this._adt_mtxAdaptMa[2][0];
    var Y = this._xyz.X * this._adt_mtxAdaptMa[0][1] + this._xyz.Y * this._adt_mtxAdaptMa[1][1] + this._xyz.Z * this._adt_mtxAdaptMa[2][1];
    var Z = this._xyz.X * this._adt_mtxAdaptMa[0][2] + this._xyz.Y * this._adt_mtxAdaptMa[1][2] + this._xyz.Z * this._adt_mtxAdaptMa[2][2];

    X *= (Ad / As);
    Y *= (Bd / Bs);
    Z *= (Cd / Cs);

    var X2 = X * this._adt_mtxAdaptMaI[0][0] + Y * this._adt_mtxAdaptMaI[1][0] + Z * this._adt_mtxAdaptMaI[2][0];
    var Y2 = X * this._adt_mtxAdaptMaI[0][1] + Y * this._adt_mtxAdaptMaI[1][1] + Z * this._adt_mtxAdaptMaI[2][1];
    var Z2 = X * this._adt_mtxAdaptMaI[0][2] + Y * this._adt_mtxAdaptMaI[1][2] + Z * this._adt_mtxAdaptMaI[2][2];

    return [X2, Y2, Z2];
}

ColorRNA.prototype._adt_invAdaptation = function (xyz, lightName, algName)
{

    this._adt_setRefWhite(lightName);
    this._adt_setAdaptMa(algName);


    var As = this._adt_refWhite.X * this._adt_mtxAdaptMa[0][0] + this._adt_refWhite.Y * this._adt_mtxAdaptMa[1][0] + this._adt_refWhite.Z * this._adt_mtxAdaptMa[2][0];
    var Bs = this._adt_refWhite.X * this._adt_mtxAdaptMa[0][1] + this._adt_refWhite.Y * this._adt_mtxAdaptMa[1][1] + this._adt_refWhite.Z * this._adt_mtxAdaptMa[2][1];
    var Cs = this._adt_refWhite.X * this._adt_mtxAdaptMa[0][2] + this._adt_refWhite.Y * this._adt_mtxAdaptMa[1][2] + this._adt_refWhite.Z * this._adt_mtxAdaptMa[2][2];

    var Ad = this._adt_refWhiteRGB.X * this._adt_mtxAdaptMa[0][0] + this._adt_refWhiteRGB.Y * this._adt_mtxAdaptMa[1][0] + this._adt_refWhiteRGB.Z * this._adt_mtxAdaptMa[2][0];
    var Bd = this._adt_refWhiteRGB.X * this._adt_mtxAdaptMa[0][1] + this._adt_refWhiteRGB.Y * this._adt_mtxAdaptMa[1][1] + this._adt_refWhiteRGB.Z * this._adt_mtxAdaptMa[2][1];
    var Cd = this._adt_refWhiteRGB.X * this._adt_mtxAdaptMa[0][2] + this._adt_refWhiteRGB.Y * this._adt_mtxAdaptMa[1][2] + this._adt_refWhiteRGB.Z * this._adt_mtxAdaptMa[2][2];

    var X1 = xyz[0] * this._adt_mtxAdaptMa[0][0] + xyz[1] * this._adt_mtxAdaptMa[1][0] + xyz[2] * this._adt_mtxAdaptMa[2][0];
    var Y1 = xyz[0] * this._adt_mtxAdaptMa[0][1] + xyz[1] * this._adt_mtxAdaptMa[1][1] + xyz[2] * this._adt_mtxAdaptMa[2][1];
    var Z1 = xyz[0] * this._adt_mtxAdaptMa[0][2] + xyz[1] * this._adt_mtxAdaptMa[1][2] + xyz[2] * this._adt_mtxAdaptMa[2][2];

    X1 *= (Ad / As);
    Y1 *= (Bd / Bs);
    Z1 *= (Cd / Cs);

    var X2 = X1 * this._adt_mtxAdaptMaI[0][0] + Y1 * this._adt_mtxAdaptMaI[1][0] + Z1 * this._adt_mtxAdaptMaI[2][0];
    var Y2 = X1 * this._adt_mtxAdaptMaI[0][1] + Y1 * this._adt_mtxAdaptMaI[1][1] + Z1 * this._adt_mtxAdaptMaI[2][1];
    var Z2 = X1 * this._adt_mtxAdaptMaI[0][2] + Y1 * this._adt_mtxAdaptMaI[1][2] + Z1 * this._adt_mtxAdaptMaI[2][2];

    return [X2, Y2, Z2];
}


ColorRNA.prototype._adt_setRefWhite = function (lightname)
{
    if (this._refWhiteNameUSER.length > 0)//强制使用用户指定参考白
    {
        lightname = this._refWhiteNameUSER
    }


    this._adt_refWhite.Y = 1.0;
    switch (lightname)
    {
        case "A" ://(ASTM E308-01)
        {
            this._adt_refWhite.X = 1.09850;
            this._adt_refWhite.Z = 0.35585;
            break;
        }
        case "B" ://(Wyszecki & Stiles, p. 769)
        {
            this._adt_refWhite.X = 0.99072;
            this._adt_refWhite.Z = 0.85223;
            break;
        }
        case "C" :// (ASTM E308-01)
        {
            this._adt_refWhite.X = 0.98074;
            this._adt_refWhite.Z = 1.18232;
            break;
        }
        case "D50" :
        {
            this._adt_refWhite.X = 0.96422;
            this._adt_refWhite.Z = 0.82521;
            break;
        }
        case "D55" :
        {
            this._adt_refWhite.X = 0.95682;
            this._adt_refWhite.Z = 0.92149;
            break;
        }
        case "D65" :
        {
            this._adt_refWhite.X = 0.95047;
            this._adt_refWhite.Z = 1.08883;
            break;
        }
        case "D75" :
        {
            this._adt_refWhite.X = 0.94972;
            this._adt_refWhite.Z = 1.22638;
            break;
        }
        case "E" :
        {
            this._adt_refWhite.X = 1.00000;
            this._adt_refWhite.Z = 1.00000;
            break;
        }
        case "F2" :
        {
            this._adt_refWhite.X = 0.99186;
            this._adt_refWhite.Z = 0.67393;
            break;
        }
        case "F7" :
        {
            this._adt_refWhite.X = 0.95041;
            this._adt_refWhite.Z = 1.08747;
            break;
        }
        case "F11" :
        {
            this._adt_refWhite.X = 1.00962;
            this._adt_refWhite.Z = 0.64350;
            break;
        }
    }
}

ColorRNA.prototype._adt_setAdaptMa = function (aglName)
{
    switch (aglName)
    {
        case "Bradford" :
        {
            this._adt_mtxAdaptMa = [
                [0.8951, -0.7502, 0.0389],
                [0.2664, 1.7135, -0.0685],
                [-0.1614, 0.0367, 1.0296]];

            this._adt_mtxAdaptMaI = [
                [0.9869929054667123, 0.43230526972339456, -0.008528664575177328],
                [-0.14705425642099013, 0.5183602715367776, 0.04004282165408487],
                [0.15996265166373125, 0.0492912282128556, 0.9684866957875502]];
            break;
        }
        case "vonKries" : //von Kries
        {
            this._adt_mtxAdaptMa = [
                [0.40024, -0.2263, 0],
                [0.7076, 1.16532, 0],
                [-0.08081, 0.0457, 0.91822]];

            this._adt_mtxAdaptMaI = [
                [1.8599363874558397, 0.3611914362417676, -0],
                [-1.1293816185800916, 0.6388124632850422, -0],
                [0.21989740959619328, -0.000006370596838650885, 1.0890636230968613]];
            break;
        }
        case "none":
        {
            this._adt_mtxAdaptMa = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            this._adt_mtxAdaptMaI = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            break;
        }

    }


}


//让经过 Gamma  的变换 RGB 归一化值还原
ColorRNA.prototype._deGamma = function (rgb)
{
    var newRGB = 0;
    var sign = 1;

    if (rgb < 0)//处理负数情况
    {
        sign = -1;
        rgb = -rgb;
    }


    if (this._gamma < 0)//----sRGB-----------
    {

        if (rgb <= 0.0404482362771076)
        {
            newRGB = sign * rgb / 12.92;
        }
        else
        {
            newRGB = sign * Math.pow((rgb + 0.055) / 1.055, 2.4);
        }
    }
    if (this._gamma == 0)//-----L*-----------
    {

        if (rgb <= 0.08)
        {
            newRGB = sign * 2700.0 * rgb / 24389.0;
        }
        else
        {
            newRGB = sign * ((((1000000.0 * rgb + 480000.0) * rgb + 76800.0) * rgb + 4096.0) / 1560896.0);
        }
    }
    if (this._gamma > 0)//-----普通 Gamma-----------
    {

        newRGB = sign * Math.pow(rgb, this._gamma);
    }

    return newRGB;
}


ColorRNA.prototype._getRGBnucleotids = function (rabColorSpaceName, XYZtoRGB)
{
    this._adt_refWhiteRGB.Y = 1.0;

    this._refWhiteName = "D65";//设置缺省值
    this._doAdapta = true;//设置缺省

    switch (rabColorSpaceName)
    {

        //sRGB---------------------------------------
        case "sRGB":
        {
            this._gamma = -2.2;
            this._adt_refWhiteRGB.X = 0.95047;
            this._adt_refWhiteRGB.Z = 1.08883;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[3.2404541621141045, -1.5371385127977166, -0.498531409556016],
                        [-0.9692660305051868, 1.8760108454466942, 0.041556017530349834],
                        [0.055643430959114726, -0.2040259135167538, 1.0572251882231791]];
                }
                else
                {
                    return [[3.2404542, -1.5371385, -0.4985314],
                        [-0.969266, 1.8760108, 0.041556],
                        [0.0556434, -0.2040259, 1.0572252]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.4124564390896922, 0.357576077643909, 0.18043748326639894],
                    [0.21267285140562253, 0.715152155287818, 0.07217499330655958],
                    [0.0193338955823293, 0.11919202588130297, 0.9503040785363679]];
            }
            else
            {
                return [[0.4124564, 0.3575761, 0.1804375],
                    [0.2126729, 0.7151522, 0.072175],
                    [0.0193339, 0.119192, 0.9503041]];
            }
            break;
        }
        //Adobe RGB (1998)-------------------------------------
        case "AdobeRGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.95047;
            this._adt_refWhiteRGB.Z = 1.08883;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[2.041368979260079, -0.5649463871751954, -0.3446943843778483],
                        [-0.9692660305051861, 1.876010845446693, 0.041556017530349786],
                        [0.013447387216170255, -0.11838974235412553, 1.0154095719504164]];
                }
                else
                {
                    return [[2.041369, -0.5649464, -0.3446944],
                        [-0.969266, 1.8760108, 0.041556],
                        [0.0134474, -0.1183897, 1.0154096]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.5767308871981477, 0.18555395071121408, 0.18818516209063843],
                    [0.29737686371154487, 0.6273490714522, 0.07527406483625537],
                    [0.027034260337413143, 0.0706872193185578, 0.9911085203440292]];
            }
            else
            {
                return [[0.5767309, 0.185554, 0.1881852],
                    [0.2973769, 0.6273491, 0.0752741],
                    [0.0270343, 0.0706872, 0.9911085]];
            }
            break;
        }
        //Apple RGB -------------------------------------
        case "AppleRGB":
        {
            this._gamma = 1.8;
            this._adt_refWhiteRGB.X = 0.95047;
            this._adt_refWhiteRGB.Z = 1.08883;


            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[2.951537290948746, -1.2894115658994107, -0.473844478043996],
                        [-1.0851093382231771, 1.9908566080903682, 0.037202561107440836],
                        [0.08549335448914223, -0.26949635273220945, 1.0912975249496382]];
                }
                else
                {
                    return [[2.9515373, -1.2894116, -0.4738445],
                        [-1.0851093, 1.9908566, 0.0372026],
                        [0.0854934, -0.2694964, 1.0912975]];
                }
                break;
            }

            if (this._dLV == 2)
            {
                return [[0.4497288365610329, 0.31624860938967136, 0.1844925540492957],
                    [0.24465248708920193, 0.6720282949530516, 0.08331921795774647],
                    [0.025184814847417827, 0.14118241490610328, 0.9224627702464786]];
            }
            else
            {
                return [[0.4497288, 0.3162486, 0.1844926],
                    [0.2446525, 0.6720283, 0.0833192],
                    [0.0251848, 0.1411824, 0.9224628]];
            }
            break;
        }
        //Best RGB -------------------------------------
        case "BestRGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[1.7552599329466554, -0.4836785613998958, -0.25300004986116026],
                        [-0.5441336296844771, 1.5068789209543363, 0.021552825898898505],
                        [0.00634673971374007, -0.01757613896601896, 1.225695866021057]];
                }
                else
                {
                    return [[1.7552599, -0.4836786, -0.253],
                        [-0.5441336, 1.5068789, 0.0215528],
                        [0.0063467, -0.0175761, 1.2256959]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.6326696499956765, 0.20455579792131387, 0.12699455208300955],
                    [0.22845686422193134, 0.7373522948326431, 0.034190840945425655],
                    [0, 0.009514223159130886, 0.8156957768408691]];
            }
            else
            {
                return [[0.6326696, 0.2045558, 0.1269946],
                    [0.2284569, 0.7373523, 0.0341908],
                    [0, 0.0095142, 0.8156958]];
            }
            break;
        }
        //Beta RGB -------------------------------------
        case "BetaRGB":
        {

            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;


            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[1.6832269542614402, -0.4282362832078967, -0.2360184809079736],
                        [-0.7710228944287557, 1.7065571005222588, 0.04468995133824896],
                        [0.04000128943944507, -0.08853755837368198, 1.272364022576533]];
                }
                else
                {
                    return [[1.683227, -0.4282363, -0.2360185],
                        [-0.7710229, 1.7065571, 0.04469],
                        [0.0400013, -0.0885376, 1.272364]];
                }
                break;
            }

            if (this._dLV == 2)
            {
                return [[0.671253700292543, 0.17458338980154234, 0.11838290990591456],
                    [0.30327257771637545, 0.6637860908315439, 0.03294133145208057],
                    [5.409707559738789e-17, 0.040700961469342455, 0.7845090385306573]];
            }
            else
            {
                return [[0.6712537, 0.1745834, 0.1183829],
                    [0.3032726, 0.6637861, 0.0329413],
                    [0, 0.040701, 0.784509]];
            }
            break;
        }
        //Bruce RGB -------------------------------------
        case "BruceRGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.95047;
            this._adt_refWhiteRGB.Z = 1.08883;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[2.745466866559799, -1.1358136045241505, -0.4350268528006593],
                        [-0.9692660305051869, 1.8760108454466942, 0.04155601753034985],
                        [0.011272295190850611, -0.1139754291519338, 1.0132540899331266]];
                }
                else
                {
                    return [[2.7454669, -1.1358136, -0.4350269],
                        [-0.969266, 1.8760108, 0.041556],
                        [0.0112723, -0.1139754, 1.0132541]];
                }
                break;
            }

            if (this._dLV == 2)
            {
                return [[0.4674161637795275, 0.2944512299212599, 0.18860260629921258],
                    [0.24101145944881885, 0.6835474980314961, 0.07544104251968503],
                    [0.021910132677165326, 0.0736128074803149, 0.9933070598425197]];
            }
            else
            {
                return [[0.4674162, 0.2944512, 0.1886026],
                    [0.2410115, 0.6835475, 0.075441],
                    [0.0219101, 0.0736128, 0.9933071]];
            }
            break;
        }
        //CIE RGB -------------------------------------
        case "CIERGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 1.00000;
            this._adt_refWhiteRGB.Z = 1.00000;


            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[2.370674329102138, -0.9000405327854051, -0.4706337963167336],
                        [-0.513884966581945, 1.42530358655747, 0.08858138002447524],
                        [0.005298175073030407, -0.0146949384101032, 1.0093967633370728]];
                }
                else
                {
                    return [[2.3706743, -0.9000405, -0.4706338],
                        [-0.513885, 1.4253036, 0.0885814],
                        [0.0052982, -0.0146949, 1.0093968]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.48871796548117163, 0.31068034326701394, 0.20060169125181454],
                    [0.1762044365340279, 0.8129846938775509, 0.010810869588421142],
                    [0, 0.010204828793442072, 0.9897951712065579]];
            }
            else
            {
                return [[0.488718, 0.3106803, 0.2006017],
                    [0.1762044, 0.8129847, 0.0108109],
                    [0, 0.0102048, 0.9897952]];
            }

            break;
        }
        //ColorMatch RGB -------------------------------------
        case "ColorMatchRGB":
        {
            this._gamma = 1.8;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[2.6422874096694384, -1.2234270341709754, -0.39301430179044206],
                        [-1.1119762771300263, 2.059018273920192, 0.01596138196837363],
                        [0.08216985846755141, -0.2807254155216341, 1.4559876814266082]];
                }
                else
                {
                    return [[2.6422874, -1.223427, -0.3930143],
                        [-1.1119763, 2.0590183, 0.0159614],
                        [0.0821699, -0.2807254, 1.4559877]];
                }
                break;
            }

            if (this._dLV == 2)
            {
                return [[0.509343853397384, 0.3209070884940387, 0.13396905810857737],
                    [0.2748839843731914, 0.6581314865725201, 0.06698452905428869],
                    [0.024254469209399214, 0.1087820638962844, 0.6921734668943165]];
            }
            else
            {
                return [[0.5093439, 0.3209071, 0.1339691],
                    [0.274884, 0.6581315, 0.0669845],
                    [0.0242545, 0.1087821, 0.6921735]];
            }
            break;
        }
        //ECI RGB v2 -------------------------------------
        case "ECIRGBv2":
        {
            this._gamma = 0;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[1.7827617697270912, -0.49698473887532724, -0.2690100880150854],
                        [-0.9593623286322266, 1.9477962429805813, -0.027580735166583017],
                        [0.08593169513496947, -0.17446738103160447, 1.322827306926194]];
                }
                else
                {
                    return [[1.7827618, -0.4969847, -0.2690101],
                        [-0.9593623, 1.9477962, -0.0275807],
                        [0.0859317, -0.1744674, 1.3228273]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.650204257079646, 0.1780773570796461, 0.13593838584070797],
                    [0.32024985796460176, 0.6020710644121368, 0.07767907762326169],
                    [-5.3871025143217717e-17, 0.06783899317319857, 0.7573710068268015]];
            }
            else
            {
                return [[0.6502043, 0.1780774, 0.1359384],
                    [0.3202499, 0.6020711, 0.0776791],
                    [-0, 0.067839, 0.757371]];
            }

            break;
        }
        //Don RGB 4 -------------------------------------
        case "DonRGB4":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;


            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[1.7603902333031187, -0.48811980100639313, -0.25361261951399006],
                        [-0.7126287844544976, 1.6527431594729967, 0.041671534607820124],
                        [0.00782073858032594, -0.03474110403369325, 1.244774289550262]];
                }
                else
                {
                    return [[1.7603902, -0.4881198, -0.2536126],
                        [-0.7126288, 1.6527432, 0.0416715],
                        [0.0078207, -0.0347411, 1.2447743]];
                }
                break;
            }

            if (this._dLV == 2)
            {
                return [[0.645771138436728, 0.19335110357732524, 0.12509775798594666],
                    [0.2783496286365207, 0.6879702057518782, 0.033680165611601025],
                    [0.0037113283818203304, 0.01798614916998376, 0.8035125224481958]];
            }
            else
            {
                return [[0.6457711, 0.1933511, 0.1250978],
                    [0.2783496, 0.6879702, 0.0336802],
                    [0.0037113, 0.0179861, 0.8035125]];
            }

            break;
        }
        //Ekta Space PS5 -------------------------------------
        case "EktaSpacePS5":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;


            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[2.0043819420638203, -0.7304844248729281, -0.24500518813859393],
                        [-0.7110285484718862, 1.6202125940588885, 0.07922268628430854],
                        [0.038126311068521795, -0.0868779875167958, 1.2725437595985338]];
                }
                else
                {
                    return [[2.0043819, -0.7304844, -0.2450052],
                        [-0.7110285, 1.6202126, 0.0792227],
                        [0.0381263, -0.086878, 1.2725438]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.5938913615570769, 0.2729801227546152, 0.09734851568830809],
                    [0.26062858312936465, 0.7349464843393485, 0.004424932531286731],
                    [4.743538587961513e-17, 0.04199694196224853, 0.7832130580377514]];
            }
            else
            {
                return [[0.5938914, 0.2729801, 0.0973485],
                    [0.2606286, 0.7349465, 0.0044249],
                    [0, 0.0419969, 0.7832131]];
            }

            break;
        }
        //NTSC RGB -------------------------------------
        case "NTSCRGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.98074;
            this._adt_refWhiteRGB.Z = 1.18232;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[1.9099960989184541, -0.5324541554529706, -0.2882091300158282],
                        [-0.9846663050051847, 1.9991709828893145, -0.02830819991079395],
                        [0.0583056402155416, -0.11837811801337218, 0.8975534918028807]];
                }
                else
                {
                    return [[1.9099961, -0.5324542, -0.2882091],
                        [-0.9846663, 1.999171, -0.0283082],
                        [0.0583056, -0.1183781, 0.8975535]];
                }
                break;
            }

            if (this._dLV == 2)
            {
                return [[0.6068909212389378, 0.1735011212389381, 0.20034795752212392],
                    [0.2989164238938052, 0.5865990289506955, 0.11448454715549937],
                    [-5.028240852204785e-17, 0.06609566523388125, 1.116224334766119]];
            }
            else
            {
                return [[0.6068909, 0.1735011, 0.200348],
                    [0.2989164, 0.586599, 0.1144845],
                    [-0, 0.0660957, 1.1162243]];
            }
            break;
        }

        //PAL/SECAM RGB -------------------------------------
        case "PALSECAMRGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.95047;
            this._adt_refWhiteRGB.Z = 1.08883;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[3.0628971232226965, -1.393179136493678, -0.4757516712579541],
                        [-0.9692660305051867, 1.876010845446694, 0.04155601753034983],
                        [0.06787750995175175, -0.22885477399033227, 1.0693489682562851]];
                }
                else
                {
                    return [[3.0628971, -1.3931791, -0.4757517],
                        [-0.969266, 1.8760108, 0.041556],
                        [0.0678775, -0.2288548, 1.069349]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.4306190335097004, 0.3415419122574957, 0.17830905423280421],
                    [0.22203793915343925, 0.7066384391534394, 0.07132362169312169],
                    [0.020185267195767184, 0.12955038051146386, 0.9390943522927689]];
            }
            else
            {
                return [[0.430619, 0.3415419, 0.1783091],
                    [0.2220379, 0.7066384, 0.0713236],
                    [0.0201853, 0.1295504, 0.9390944]];
            }
            break;
        }
        //ProPhoto RGB -------------------------------------
        case "ProPhotoRGB":
        {
            this._gamma = 1.8;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[1.3459433009386654, -0.25560750931676696, -0.05111176587088495],
                        [-0.544598869458717, 1.508167317720767, 0.020535141586646915],
                        [0, -0, 1.2118127506937628]];
                }
                else
                {
                    return [[1.3459433, -0.2556075, -0.0511118],
                        [-0.5445989, 1.5081673, 0.0205351],
                        [0, 0, 1.2118128]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.7976749444306044, 0.13519170147409815, 0.031353354095297416],
                    [0.2880402378623102, 0.7118740972357901, 0.00008566490189971971],
                    [0, 0, 0.82521]];
            }
            else
            {
                return [[0.7976749, 0.1351917, 0.0313534],
                    [0.2880402, 0.7118741, 0.0000857],
                    [0, 0, 0.82521]];
            }
            break;
        }
        //SMPTE-C RGB -------------------------------------
        case "SMPTECRGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.95047;
            this._adt_refWhiteRGB.Z = 1.08883;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[3.505395974670056, -1.7394893606633242, -0.543964026874098],
                        [-1.0690722072799321, 1.9778244814100043, 0.035172230231857005],
                        [0.056320014767146896, -0.1970226122130985, 1.0502026283050325]];
                }
                else
                {
                    return [[3.505396, -1.7394894, -0.543964],
                        [-1.0690722, 1.9778245, 0.0351722],
                        [0.05632, -0.1970226, 1.0502026]];
                }
                break;
            }

            if (this._dLV == 2)
            {
                return [[0.3935890809541021, 0.365249655704132, 0.19163126334176603],
                    [0.21241315480062656, 0.7010436940127694, 0.08654315118660402],
                    [0.018742337188290558, 0.11193134610287912, 0.9581563167088301]];
            }
            else
            {
                return [[0.3935891, 0.3652497, 0.1916313],
                    [0.2124132, 0.7010437, 0.0865432],
                    [0.0187423, 0.1119313, 0.9581563]];
            }
            break;
        }
        //Wide Gamut RGB -------------------------------------
        case "WideGamutRGB":
        {
            this._gamma = 2.2;
            this._adt_refWhiteRGB.X = 0.96422;
            this._adt_refWhiteRGB.Z = 0.82521;

            if (XYZtoRGB == true)
            {
                if (this._dLV == 2)
                {
                    return [[1.4628067131216802, -0.18406234137547003, -0.27436064462466103],
                        [-0.5217933153765428, 1.447238063402864, 0.06772274590650387],
                        [0.034934211112166366, -0.09689300063185764, 1.2884099024409357]];
                }
                else
                {
                    return [[1.4628067, -0.1840623, -0.2743606],
                        [-0.5217933, 1.4472381, 0.0677227],
                        [0.0349342, -0.096893, 1.2884099]];
                }
                break;
            }


            if (this._dLV == 2)
            {
                return [[0.7161045686144476, 0.10092960102210317, 0.1471858303634494],
                    [0.25818736147323623, 0.7249378299500627, 0.016874808576701202],
                    [0, 0.05178127356786167, 0.7734287264321384]];
            }
            else
            {
                return [[0.7161046, 0.1009296, 0.1471858],
                    [0.2581874, 0.7249378, 0.0168748],
                    [0, 0.0517813, 0.7734287]];
            }
            break;
        }
    }
}


ColorRNA.prototype._RGB_to_XYZ = function ()
{
    var x, y, z;
    var nucleotids = this._getRGBnucleotids(this._colorSpace);


    var rgbs =
        [
            this._deGamma(this._normaliz(this.r)),
            this._deGamma(this._normaliz(this.g)),
            this._deGamma(this._normaliz(this.b))
        ];


    x = this._arrayProduct(rgbs, nucleotids[0]);
    y = this._arrayProduct(rgbs, nucleotids[1]);
    z = this._arrayProduct(rgbs, nucleotids[2]);

    this._xyz.X = x;
    this._xyz.Y = y;
    this._xyz.Z = z;

    if ((this._doAdapta == true || this._doAdaptaUSER == 1 ) && this._doAdaptaUSER != -1)
    {
        var xyz2 = this._adt_adaptation(this._refWhiteName, this._adtAlg);
        this._xyz.X = xyz2[0];
        this._xyz.Y = xyz2[1];
        this._xyz.Z = xyz2[2];

    }

    return [this._xyz.X, this._xyz.Y, this._xyz.Z]
}

ColorRNA.prototype._XYZ_to_RGB = function ()
{
    var nucleotids = this._getRGBnucleotids(this._colorSpace, true);
    var xyzs = [this._xyz.X, this._xyz.Y, this._xyz.Z];


    if ((this._doAdapta == true || this._doAdaptaUSER == 1 ) && this._doAdaptaUSER != -1)
    {

        xyzs = this._adt_invAdaptation(xyzs, this._refWhiteName, this._adtAlg);
    }

    var _r, _g, _b;

    _r = this._arrayProduct(xyzs, nucleotids[0]);
    _g = this._arrayProduct(xyzs, nucleotids[1]);
    _b = this._arrayProduct(xyzs, nucleotids[2]);

    var rgbs =
        [
            this._normaliz(this._enGamma(_r), 0, 1, 255),
            this._normaliz(this._enGamma(_g), 0, 1, 255),
            this._normaliz(this._enGamma(_b), 0, 1, 255)
        ];

    this._arrayRound(rgbs);
    return rgbs;
}


ColorRNA.prototype._XYZ_to_Lab = function (psMod)
{
    var xyz = [this._xyz.X, this._xyz.Y, this._xyz.Z];

    var kE = 0.008856451679 //216.0 / 24389.0;
    var kK = 903.2962962963 //24389.0 / 27.0;


    this._adt_setRefWhite("D65");

    if (psMod === true)//ps
    {
        this._getRGBnucleotids("sRGB");
        xyz = this._adt_adaptation("D50", this._adtAlg);
    }


    var xr = xyz[0] / this._adt_refWhite.X;
    var yr = xyz[1] / this._adt_refWhite.Y;
    var zr = xyz[2] / this._adt_refWhite.Z;

    var fx = (xr > kE) ? Math.pow(xr, 1.0 / 3.0) : ((kK * xr + 16.0) / 116.0);
    var fy = (yr > kE) ? Math.pow(yr, 1.0 / 3.0) : ((kK * yr + 16.0) / 116.0);
    var fz = (zr > kE) ? Math.pow(zr, 1.0 / 3.0) : ((kK * zr + 16.0) / 116.0);

    var Lab = [116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz)];

    return Lab;
}

ColorRNA.prototype._Lab_to_XYZ = function (Labs, psMod)
{

    var xyz = [0, 0, 0];

    var kE = 0.008856451679 //216.0 / 24389.0;
    var kK = 903.2962962963 //24389.0 / 27.0;
    var kKE = 8.0;


    var Lab =
    {
        L: Labs[0],
        a: Labs[1],
        b: Labs[2],
    }

    var fy = (Lab.L + 16.0) / 116.0;
    var fx = 0.002 * Lab.a + fy;
    var fz = fy - 0.005 * Lab.b;

    var fx3 = fx * fx * fx;
    var fz3 = fz * fz * fz;

    var xr = (fx3 > kE) ? fx3 : ((116.0 * fx - 16.0) / kK);
    var yr = (Lab.L > kKE) ? Math.pow((Lab.L + 16.0) / 116.0, 3.0) : (Lab.L / kK);
    var zr = (fz3 > kE) ? fz3 : ((116.0 * fz - 16.0) / kK);


    //if (psMod === true)
    //{
    //    this._adt_setRefWhite("D65");
    //}


    this._adt_setRefWhite("D50");

    xyz[0] = xr * this._adt_refWhite.X;
    xyz[1] = yr * this._adt_refWhite.Y;
    xyz[2] = zr * this._adt_refWhite.Z;

    this._xyz.X = xyz[0];
    this._xyz.Y = xyz[1];
    this._xyz.Z = xyz[2];

    if (psMod === true)
    {
        this._getRGBnucleotids("sRGB")
       // xyz = this._adt_adaptation("D65", this._adtAlg);
        xyz = this._adt_invAdaptation(xyz,"D50", this._adtAlg);
    }

    this._xyz.X = xyz[0];
    this._xyz.Y = xyz[1];
    this._xyz.Z = xyz[2];


    return [this._xyz.X, this._xyz.Y, this._xyz.Z];
}


ColorRNA.prototype._XYZ_to_xyY = function ()
{
    var xyY = [0, 0, 0];
    var Den = this._xyz.X + this._xyz.Y + this._xyz.Z;
    if (Den > 0.0)
    {
        xyY[0] = this._xyz.X / Den;
        xyY[1] = this._xyz.Y / Den;
    }
    else
    {
        this._adt_setRefWhite(this._refWhiteName);
        xyY[0] = this._adt_refWhite.X / (this._adt_refWhite.X + this._adt_refWhite.Y + this._adt_refWhite.Z);
        xyY[1] = this._adt_refWhite.Y / (this._adt_refWhite.X + this._adt_refWhite.Y + this._adt_refWhite.Z);
    }

    xyY[2] = this._xyz.Y;

    return xyY;
}


// 检查输入的 RGB 值，如果是 0~1 的小数形式将转化为 0~255 的形式
ColorRNA.prototype._normaInputRGB = function (inArray)
{
    var modeFloat = false;
    var z = 0
    var flTest = "";

    if (inArray.length == 3)
    {
        if (inArray[1] > 1 && inArray[1] > 1 && inArray[1] > 1)
        {
            return inArray;
        }

        for (z = 0; z < inArray.length; z++)
        {
            if (String(inArray[z]).indexOf(".") > -1)
            {
                modeFloat = true;
            }
        }
        if (modeFloat == true)
        {
            for (z = 0; z < inArray.length; z++)
            {
                inArray[z] = this._normaliz(inArray[z], 0, 1, 255);
            }
        }

    }

    return inArray;
}

// 检查输出的 RGB 值，将小于 0 和 -0 的值转换为 0；
ColorRNA.prototype._normaOutRGB = function (inArray)
{

    var z = 0
    for (z = 0; z < inArray.length; z++)
    {
        inArray[z] = Math.round(inArray[z]);
        if (inArray[z] < 0 || inArray[z] == -0)
        {
            inArray[z] = 0;
        }
    }
    return inArray;
}

// 检查输出的 Lab 值，四舍五入舍到 1 位小数，PS(PhotoShop)模式完全舍去小数位；
ColorRNA.prototype._normaOutLab = function (inArray, PSMod)
{
    var z = 0
    for (z = 0; z < inArray.length; z++)
    {
        if (PSMod)
        {
            inArray[z] = Math.round(inArray[z]);
        }
        else
        {
            inArray[z] = +inArray[z].toFixed(1);
        }

    }
    return inArray;
}


// 检查输入的 XYZ 值，如果有非 0~1 形式的值，将把所有值除以 100
ColorRNA.prototype._normaInputXYZ = function (inArray)
{

    var z = 0

    if (inArray[0] > 1 || inArray[1] > 1 || inArray[2] > 1)
    {
        for (z = 0; z < inArray.length; z++)
        {
            inArray[z] = inArray[z] / 100;

        }
    }
    return inArray;
}


//  设置指定的参考白色（光照条件）,没有参数将设置为缺省值（RGB 默认 D65）
ColorRNA.prototype.setRefWhite = function (inRefWhiteName)
{
    if (arguments.length == 0)
    {
        this._refWhiteNameUSER = "";
    }
    else
    {
        this._refWhiteNameUSER = inRefWhiteName;
    }

    return this;
}

//  返回当前参考白色设置（光照条件）
ColorRNA.prototype.getRefWhite = function ()
{

    if (this._refWhiteNameUSER.length > 0)
    {
        return this._refWhiteNameUSER;
    }
    return this._refWhiteName;
}

//默认以 sRGB 设置 RGB 的值，
ColorRNA.prototype.rgb = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.sRGB));
}


//供各种色彩空间设置取值函数调用的模板----------------------------------
ColorRNA.prototype._rgbX = function (argus, colorSpace)
{
    var rgb = [0, 0, 0];
    this._colorSpace = colorSpace;

    if (argus.length == 0)
    {
        rgb = this._XYZ_to_RGB();
        return this._normaOutRGB(rgb);
    }

    if (argus.length == 1)
    {
        if (Array.isArray(argus[0]))
        {
            if (argus[0].length == 3)
            {
                rgb = argus[0];
            }
        }
    }
    if (argus.length == 3)
    {
        rgb[0] = argus[0];
        rgb[1] = argus[1];
        rgb[2] = argus[2];
    }

    this._normaInputRGB(rgb);
    this.r = rgb[0];
    this.g = rgb[1];
    this.b = rgb[2];
    this._RGB_to_XYZ();


}

ColorRNA.prototype._LabX = function (argus, PhotoShopMod)
{
    var Lab = [0, 0, 0];

    if (argus.length == 0)
    {
        Lab = this._XYZ_to_Lab(PhotoShopMod);
        this._normaOutLab(Lab, PhotoShopMod);
        return Lab;
    }

    if (argus.length == 1)
    {
        if (Array.isArray(argus[0]))
        {
            if (argus[0].length == 3)
            {
                Lab = argus[0];
            }
        }
    }
    if (argus.length == 3)
    {
        Lab[0] = argus[0];
        Lab[1] = argus[1];
        Lab[2] = argus[2];
    }

    return this._Lab_to_XYZ(Lab, PhotoShopMod);
}


ColorRNA.prototype.LabPS = function ()
{
    return (this._LabX(arguments, true));
}

ColorRNA.prototype.Lab = function ()
{
    return (this._LabX(arguments, false));
}


// 颜色设置、取值器，带参数调用设置颜色，不带参数调用取颜色
// 各种 RGB 色彩空间 ---------------------------------------------------------------
ColorRNA.prototype.sRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.sRGB));
}


ColorRNA.prototype.AdobeRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.AdobeRGB));
}

ColorRNA.prototype.AppleRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.AppleRGB));
}

ColorRNA.prototype.BestRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.BestRGB));
}

ColorRNA.prototype.BetaRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.BetaRGB));
}

ColorRNA.prototype.BruceRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.BruceRGB));
}

ColorRNA.prototype.CIERGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.CIERGB));
}

ColorRNA.prototype.ColorMatchRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.ColorMatchRGB));
}

ColorRNA.prototype.DonRGB4 = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.DonRGB4));
}

ColorRNA.prototype.ECIRGBv2 = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.ECIRGBv2));
}

ColorRNA.prototype.EktaSpacePS5 = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.EktaSpacePS5));
}

ColorRNA.prototype.NTSCRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.NTSCRGB));
}

ColorRNA.prototype.PALSECAMRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.PALSECAMRGB));
}

ColorRNA.prototype.ProPhotoRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.ProPhotoRGB));
}

ColorRNA.prototype.SMPTECRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.SMPTECRGB));
}

ColorRNA.prototype.WideGamutRGB = function ()
{
    return (this._rgbX(arguments, this._COLORSPACES.WideGamutRGB));
}
// XYZ 色彩空间---------------------------------------------------------------

ColorRNA.prototype.XYZ = function ()
{
    var xyz = [0, 0, 0];


    if (arguments.length == 0)
    {
        xyz = [this._xyz.X, this._xyz.Y, this._xyz.Z];
        return xyz;
    }

    if (arguments.length == 1)
    {
        if (Array.isArray(arguments[0]))
        {
            if (arguments[0].length == 3)
            {
                xyz = arguments[0];
            }
        }
    }
    if (arguments.length == 3)
    {
        xyz[0] = arguments[0];
        xyz[1] = arguments[1];
        xyz[2] = arguments[2];
    }

    this._normaInputXYZ(xyz);
    this._xyz.X = xyz[0];
    this._xyz.Y = xyz[1];
    this._xyz.Z = xyz[2];
    return this;
}


//test_color = new ColorRNA(33, 111, 222);
//test_color._dLV = 1;
//
//console.log(test_color.r + "," + test_color.g + "," + test_color.b);
//console.log("=========color._RGB_to_XYZ()===========");
//test_color._doAdapta = true;
//console.log(test_color._RGB_to_XYZ());
//console.log("=========_XYZ_to_RGB===========");
//console.log(test_color._XYZ_to_RGB());
//console.log("=========_XYZ_to_Lab===========");
//test_color._refWhiteName = "D50"
//console.log(test_color._XYZ_to_Lab(true));
//console.log(test_color._XYZ_to_Lab());
//console.log(test_color._XYZ_to_Lab(true));
//console.log("=========_Lab_to_XYZ===========");
//console.log(test_color._Lab_to_XYZ(test_color._XYZ_to_Lab(true), true));
//console.log("=========_XYZ_to_xyY===========");
//console.log(test_color._XYZ_to_xyY());


console.log("0.194916,0.169637,0.713401");
console.log("=========getttt===========");
var color2 = new ColorRNA();
//color2.setRefWhite("D50");
color2.sRGB(33, 111, 222);
//color2.LabPS(47, 9, -64);
//console.log("XYZ:" + color2.XYZ(0.19491595435208875,0.1696366336906597,0.7134007359464754));


//color2.XYZ(0.194916, 0.169637, 0.713401)
//console.log("sRGB:" + color2.sRGB());
//console.log("LabPS:" + color2.LabPS());
//console.log("Lab  :" + color2.Lab());
//console.log("LabPS:" + color2.LabPS());
//console.log("Lab  :" + color2.Lab());
//
//console.log("========= 47,9,-64 LAB_TO_XYZ===========");
//color2.LabPS(47, 9, -64);
//console.log("XYZ:" + color2.XYZ());
//console.log("LabPS:" + color2.LabPS());
//console.log("LabPS:" + color2.LabPS());
//console.log("Lab  :" + color2.Lab());
//console.log("XYZ:" + color2.XYZ());
//console.log("LabPS:" + color2.LabPS());
//console.log("Lab  :" + color2.Lab());
//console.log("sRGB:" + color2.sRGB());
//console.log("========= sRGB(33, 111, 222)==========");
//
//color2.sRGB(33, 111, 222);
//console.log("LabPS:" + color2.LabPS());


//color2.LabPS(47,9,-64);
//console.log("XYZ:" + color2.XYZ());
//console.log("sRGB:" + color2.sRGB());

//console.log("Lab:" + color2.Lab());
//console.log("AdobeRGB" + ":" + color2["AdobeRGB"]());
//console.log("AdobeRGB" + ":" + color2.AdobeRGB());

//console.log("WideGamutRGB:" + color2.WideGamutRGB());
//console.log("ProPhotoRGB:" + color2.ProPhotoRGB());
//console.log("ColorMatchRGB:" + color2.ColorMatchRGB());
//console.log("getRefWhite:" + color2.getRefWhite());
//console.log("_doAdapta:" + color2._doAdapta);
//console.log("XYZ:" +color2.XYZ(0.5,0.5,0.5).XYZ());

var rgb = [];
var count = 0;

//
//
//console.time("遍历");
//
//var test_color = new ColorRNA(rr, gg, bb);
//for (var rr = 0; rr < 256; rr++)
//{
//    for (var gg = 0; gg < 256; gg++)
//    {
//        for (var bb = 0; bb < 256; bb++)
//        {
//            count++;
//
//            color2.rgb(rr, gg, bb);
//            color2.AppleRGB(color2.AppleRGB());
//
//            rgb = color2.rgb();
//
//            if (count % 1000000 == 0)
//            {
//                console.log(count);
//            }
//
//            if (rgb[0] != rr && rgb[1] != gg && rgb[2] != bb)
//            {
//                console.log("E>>>" + rgb + ":" + [rr, gg, bb]);
//            }
//        }
//
//    }
//}
//console.timeEnd("遍历");
//console.log(count);

//document.getElementById("color").style.background = test_color._RGBstring();
//document.getElementById("color").style.color = test_color._RGBstring();
//document.getElementById("color").style.fontSize = "32pt";

